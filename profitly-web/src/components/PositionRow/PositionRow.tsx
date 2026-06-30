import { useState } from 'react'
import type { PositionEntry, WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import { EditEntryModal } from '../EditEntryModal/EditEntryModal'
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

export function PositionRow({ walletId, position, index, onWalletUpdate }: PositionRowProps) {
  const up = position.profitOrLoss >= 0
  const [expanded, setExpanded] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PositionEntry | null>(null)
  const { deleteEntry, deletePosition, loading } = usePositionEntries()

  const colSpan = 9

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
              {position.logoUrl ? (
                <img
                  src={position.logoUrl}
                  alt={position.ticker}
                  width={28}
                  height={28}
                  className="position-logo"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="position-logo-fallback">{position.ticker[0]}</div>
              )}
            </div>
            <div>
              <span className="position-ticker">{position.ticker}</span>
              <span className="position-entries-count">{position.entries.length} entr{position.entries.length !== 1 ? 'ies' : 'y'}</span>
            </div>
          </div>
        </td>
        <td className="right"><strong>{position.quantity}</strong></td>
        <td className="right muted">{fmtBRL(position.averagePrice)}</td>
        <td className="right muted">{fmtBRL(position.currentPrice)}</td>
        <td className="right muted">{fmtBRL(position.totalInvested)}</td>
        <td className="right muted">{fmtBRL(position.currentValue)}</td>
        <td className={`right ${up ? 'positive' : 'negative'}`}>
          {up ? '+' : ''}{fmtBRL(position.profitOrLoss)}
        </td>
        <td className="right">
          <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
            {up ? '↑' : '↓'} {up ? '+' : ''}{(position.profitOrLossPercent ?? 0).toFixed(2)}%
          </span>
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
                    <th>Date</th>
                    <th className="right">Qty</th>
                    <th className="right">Paid price</th>
                    <th className="right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {position.entries.map(entry => (
                    <tr key={entry.id} className="entry-row">
                      <td>{fmtDate(entry.date)}</td>
                      <td className="right">{entry.quantity}</td>
                      <td className="right muted">{fmtBRL(entry.paidPrice)}</td>
                      <td className="right muted">{fmtBRL(entry.total)}</td>
                      <td className="right">
                        <div className="entry-actions">
                          <button
                            className="entry-btn entry-btn--edit"
                            onClick={e => { e.stopPropagation(); setEditingEntry(entry) }}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="entry-btn entry-btn--delete"
                            onClick={e => { e.stopPropagation(); handleDeleteEntry(entry.id) }}
                            disabled={loading}
                            title="Delete entry"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="entries-footer">
                <button
                  className="entry-btn entry-btn--delete-all"
                  onClick={e => { e.stopPropagation(); handleDeletePosition() }}
                  disabled={loading}
                >
                  Remove entire position
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {editingEntry && (
        <EditEntryModal
          walletId={walletId}
          ticker={position.ticker}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={updated => { onWalletUpdate(updated); setEditingEntry(null) }}
        />
      )}
    </>
  )
}
