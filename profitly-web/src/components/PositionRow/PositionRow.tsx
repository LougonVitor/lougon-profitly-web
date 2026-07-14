import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PositionEntry, WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import { EditEntryModal } from '../EditEntryModal/EditEntryModal'
import { RedeemModal } from '../RedeemModal/RedeemModal'
import { TickerLogo } from '../TickerLogo/TickerLogo'
import { useI18n } from '../../i18n/I18nContext'
import './PositionRow.css'

interface PositionRowProps {
  walletId: string
  position: WalletPositionSummary
  index: number
  onWalletUpdate: (updated: WalletSummary) => void
}

function fmtBRL(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

// Treasury/crypto quantities are fractional — show decimals only when present
function fmtQty(v: number): string {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 8 })
}

const INDEXER_LABEL_KEYS = {
  CDI: 'indexerCdi', SELIC: 'indexerSelic', IPCA: 'indexerIpca', PREFIXADO: 'indexerPrefixado',
} as const

export function PositionRow({ walletId, position, index, onWalletUpdate }: PositionRowProps) {
  const { t } = useI18n()
  const fi = t.fixedIncome
  const up = position.profitOrLoss >= 0
  const hasQuote = position.currentPrice != null && position.currentPrice > 0
  const isFixedIncome = position.assetType?.toLowerCase() === 'fixed-income'
  // Treasury tickers are slugs (tesouro-ipca-15052029) — show the official bond name;
  // renda-fixa tickers are synthetic (rf-<uuid>) — always show the issuer/instrument name.
  const isTreasury = position.ticker.startsWith('tesouro-')
  const displayName = (isTreasury || isFixedIncome) ? (position.name ?? position.ticker) : position.ticker
  const [expanded, setExpanded] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PositionEntry | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const { deleteEntry, deletePosition, loading } = usePositionEntries()

  const colSpan = 9

  const fixedIncomeSubtitle = isFixedIncome && position.indexer
    ? `${fi[INDEXER_LABEL_KEYS[position.indexer]]} ${position.ratePercent}%`
      + (position.maturityDate ? ` · ${fi.maturityLabel} ${fmtDate(position.maturityDate)}` : ` · ${fi.dailyLiquidity}`)
    : null

  async function handleDeleteEntry(entryId: string) {
    const updated = await deleteEntry(walletId, position.ticker, entryId)
    if (updated) onWalletUpdate(updated)
  }

  async function handleDeletePosition() {
    const updated = await deletePosition(walletId, position.ticker)
    if (updated) onWalletUpdate(updated)
  }

  return (
    <>
      <tr
        className="position-row"
        style={{ animationDelay: `${0.15 + index * 0.06}s` }}
        onClick={() => setExpanded(v => !v)}
      >
        <td>
          <div className="position-identity">
            <div className="position-logo-wrap">
              <TickerLogo
                src={position.logoUrl}
                alt={position.ticker}
                width={28}
                height={28}
                className="position-logo"
              />
            </div>
            <div>
              {isFixedIncome ? (
                <span className="position-ticker">{displayName}</span>
              ) : (
                <Link
                  className="position-ticker position-ticker-link"
                  to={`/ticker/${position.ticker}`}
                  onClick={e => e.stopPropagation()}
                >
                  {displayName}
                </Link>
              )}
              {fixedIncomeSubtitle ? (
                <span className="position-entries-count">{fixedIncomeSubtitle}</span>
              ) : (
                <span className="position-entries-count">{position.entries.length} lançamento{position.entries.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </td>
        <td className="right"><strong>{fmtQty(position.quantity)}</strong></td>
        <td className="right muted">{fmtBRL(position.averagePrice)}</td>
        <td className="right muted">{hasQuote ? fmtBRL(position.currentPrice) : <span className="no-quote" title="Sem cotação disponível">—</span>}</td>
        <td className="right muted">{fmtBRL(position.totalInvested)}</td>
        <td className="right muted">{hasQuote ? fmtBRL(position.currentValue) : <span className="no-quote">—</span>}</td>
        <td className={`right ${!hasQuote ? 'muted' : up ? 'positive' : 'negative'}`}>
          {hasQuote ? <>{up ? '+' : ''}{fmtBRL(position.profitOrLoss)}</> : <span className="no-quote">—</span>}
        </td>
        <td className="right">
          {hasQuote ? (
            <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
              {up ? '↑' : '↓'} {up ? '+' : ''}{(position.profitOrLossPercent ?? 0).toFixed(2)}%
            </span>
          ) : (
            <span className="badge badge--neutral" title="Sem cotação disponível">—</span>
          )}
        </td>
        <td className="right">
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="entries-row">
          <td colSpan={colSpan} className="entries-cell">
            <div className="entries-container">
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th className="right">Qtd</th>
                    <th className="right">Preço pago</th>
                    <th className="right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {position.entries.map(entry => (
                    <tr key={entry.id} className="entry-row">
                      <td>{fmtDate(entry.date)}</td>
                      <td>
                        <span className={`entry-type-badge ${entry.type === 'SELL' ? 'entry-type-badge--sell' : 'entry-type-badge--buy'}`}>
                          {entry.type === 'SELL' ? 'Venda' : 'Compra'}
                        </span>
                      </td>
                      <td className="right">{fmtQty(entry.quantity)}</td>
                      <td className="right muted">{fmtBRL(entry.paidPrice)}</td>
                      <td className="right muted">{fmtBRL(entry.total)}</td>
                      <td className="right">
                        <div className="entry-actions">
                          <button
                            className="entry-btn entry-btn--edit"
                            onClick={e => { e.stopPropagation(); setEditingEntry(entry) }}
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            className="entry-btn entry-btn--delete"
                            onClick={e => { e.stopPropagation(); handleDeleteEntry(entry.id) }}
                            disabled={loading}
                            title="Excluir lançamento"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="entries-footer">
                {isFixedIncome && position.quantity > 0 && (
                  <button
                    className="entry-btn entry-btn--edit"
                    onClick={e => { e.stopPropagation(); setRedeeming(true) }}
                  >
                    {fi.redeem}
                  </button>
                )}
                <button
                  className="entry-btn entry-btn--delete-all"
                  onClick={e => { e.stopPropagation(); handleDeletePosition() }}
                  disabled={loading}
                >
                  Remover posição inteira
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {redeeming && (
        <RedeemModal
          walletId={walletId}
          ticker={position.ticker}
          positionName={displayName}
          onClose={() => setRedeeming(false)}
          onSuccess={updated => { onWalletUpdate(updated); setRedeeming(false) }}
        />
      )}

      {editingEntry && (
        <EditEntryModal
          walletId={walletId}
          ticker={position.ticker}
          entry={editingEntry}
          isFixedIncome={isFixedIncome}
          onClose={() => setEditingEntry(null)}
          onSuccess={updated => { onWalletUpdate(updated); setEditingEntry(null) }}
        />
      )}
    </>
  )
}
