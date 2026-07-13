import { useState } from 'react'
import type { WalletSummary } from '../../types/WalletSummary'
import { AllocationChart } from '../AllocationChart/AllocationChart'
import { useI18n } from '../../i18n/I18nContext'
import { api } from '../../lib/api'
import './WalletCard.css'

interface WalletCardProps {
  wallet: WalletSummary
  index: number
  onAddPosition: () => void
  onWalletUpdate: (updated: WalletSummary) => void
  /** Only provided for B3-sourced wallets; opens the reintegration modal. */
  onReintegrate?: () => void
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function WalletCard({ wallet, index, onAddPosition, onWalletUpdate, onReintegrate }: WalletCardProps) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(wallet.name)
  const [saving, setSaving] = useState(false)
  const up = wallet.profitOrLoss >= 0
  const isB3 = wallet.source === 'B3'

  async function handleRename() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === wallet.name) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await api.patch<WalletSummary>(`/api/wallets/${wallet.id}/name`, { name: trimmed })
      onWalletUpdate(res.data)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleRename()
    if (e.key === 'Escape') { setNameInput(wallet.name); setEditing(false) }
  }

  return (
    <div className="wallet-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="wallet-card-top">
        <div className="wallet-card-name-row">
          {editing ? (
            <input
              className="wallet-name-input"
              value={nameInput}
              autoFocus
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleRename}
              disabled={saving}
            />
          ) : (
            <>
              <span className="wallet-card-name">{wallet.name}</span>
              {isB3 && (
                <span className="wallet-b3-badge" title="Carteira integrada com a B3">
                  <span className="wallet-b3-badge-dot" />B3
                </span>
              )}
              <button
                className="wallet-rename-btn"
                onClick={() => { setNameInput(wallet.name); setEditing(true) }}
                title={t.wallet.editName}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="wallet-card-actions">
          {isB3 && onReintegrate && (
            <button className="wallet-reintegrate-btn" onClick={onReintegrate} title="Enviar um novo extrato da B3 sem duplicar o que já foi importado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Reintegrar B3
            </button>
          )}
          <button className="wallet-add-btn" onClick={onAddPosition}>{t.wallet.addPosition}</button>
        </div>
      </div>

      <div className="wallet-card-body">
        <div className="wallet-hero">
          <span className="wallet-stat-label">{t.wallet.currentValue}</span>
          <div className="wallet-hero-row">
            <span className="wallet-hero-value">{fmtBRL(wallet.currentValue)}</span>
            <span className={`wallet-return-badge ${up ? 'wallet-return-badge--up' : 'wallet-return-badge--down'}`}>
              <span className="wallet-return-arrow">{up ? '▲' : '▼'}</span>
              {up ? '+' : ''}{wallet.profitOrLossPercent.toFixed(2)}%
            </span>
          </div>

          <div className="wallet-hero-bar" aria-hidden>
            <div
              className={`wallet-hero-bar-fill ${up ? '' : 'wallet-hero-bar-fill--down'}`}
              style={{ width: `${Math.min(100, wallet.currentValue > 0 ? (wallet.totalInvested / Math.max(wallet.currentValue, wallet.totalInvested)) * 100 : 0)}%` }}
            />
          </div>

          <div className="wallet-hero-stats">
            <div className="wallet-hero-tile">
              <span className="wallet-stat-label">{t.wallet.invested}</span>
              <span className="wallet-tile-value">{fmtBRL(wallet.totalInvested)}</span>
            </div>
            <div className="wallet-hero-tile">
              <span className="wallet-stat-label">{t.wallet.profitLoss}</span>
              <span className={`wallet-tile-value ${up ? 'positive' : 'negative'}`}>
                {up ? '+' : ''}{fmtBRL(wallet.profitOrLoss)}
              </span>
            </div>
            {wallet.realizedProfitOrLoss !== 0 && (
              <div className="wallet-hero-tile">
                <span className="wallet-stat-label">{t.walletView.realized}</span>
                <span className={`wallet-tile-value ${wallet.realizedProfitOrLoss >= 0 ? 'positive' : 'negative'}`}>
                  {wallet.realizedProfitOrLoss >= 0 ? '+' : ''}{fmtBRL(wallet.realizedProfitOrLoss)}
                </span>
              </div>
            )}
          </div>
        </div>

        {wallet.positions.length > 0 && (
          <div className="wallet-card-chart">
            <span className="wallet-chart-label">{t.wallet.allocation}</span>
            <AllocationChart
              positions={wallet.positions}
              totalCurrentValue={wallet.currentValue}
            />
          </div>
        )}
      </div>
    </div>
  )
}
