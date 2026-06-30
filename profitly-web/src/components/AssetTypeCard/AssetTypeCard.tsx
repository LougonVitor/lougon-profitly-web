import { useState } from 'react'
import type { WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { PositionRow } from '../PositionRow/PositionRow'
import './AssetTypeCard.css'

interface AssetTypeCardProps {
  walletId: string
  label: string
  assetType: string
  positions: WalletPositionSummary[]
  portfolioCurrentValue: number
  onWalletUpdate: (updated: WalletSummary) => void
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number) {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2).replace('.', ',')}%`
}

function StockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function FiiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1" />
      <path d="M12 3L2 10h20L12 3z" />
      <rect x="9" y="14" width="6" height="7" />
    </svg>
  )
}

function OtherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

const ICONS: Record<string, () => JSX.Element> = {
  stock: StockIcon,
  fii: FiiIcon,
}

function AssetIcon({ assetType }: { assetType: string }) {
  const Icon = ICONS[assetType.toLowerCase()] ?? OtherIcon
  return (
    <div className={`asset-icon asset-icon--${assetType.toLowerCase()}`}>
      <Icon />
    </div>
  )
}

export function AssetTypeCard({
  walletId, label, assetType, positions, portfolioCurrentValue, onWalletUpdate,
}: AssetTypeCardProps) {
  const [expanded, setExpanded] = useState(true)

  const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0)
  const totalInvested = positions.reduce((s, p) => s + p.totalInvested, 0)
  const pnlPercent = totalInvested === 0 ? 0 : ((totalCurrentValue - totalInvested) / totalInvested) * 100
  const portfolioPercent = portfolioCurrentValue === 0 ? 0 : (totalCurrentValue / portfolioCurrentValue) * 100
  const isUp = pnlPercent >= 0

  return (
    <div className={`asset-card ${expanded ? 'asset-card--expanded' : ''}`}>
      <button className="asset-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="asset-card-left">
          <AssetIcon assetType={assetType} />
          <span className="asset-card-label">{label}</span>
        </div>

        <div className="asset-card-stats">
          <div className="asset-stat">
            <span className="asset-stat-label">Ativos</span>
            <span className="asset-stat-value">{positions.length}</span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">Valor total</span>
            <span className="asset-stat-value">{fmtBRL(totalCurrentValue)}</span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">Rentabilidade</span>
            <span className={`asset-stat-value asset-stat-value--${isUp ? 'up' : 'down'}`}>
              {fmtPct(pnlPercent)}
            </span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">% na carteira</span>
            <span className="asset-stat-value">{portfolioPercent.toFixed(1).replace('.', ',')}%</span>
          </div>
        </div>

        <span className={`asset-card-chevron ${expanded ? 'asset-card-chevron--open' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="asset-card-body">
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Ticker</th>
                <th className="right" style={{ width: 60 }}>Qtd</th>
                <th className="right" style={{ width: 110 }}>Preço médio</th>
                <th className="right" style={{ width: 120 }}>Preço atual</th>
                <th className="right" style={{ width: 120 }}>Investido</th>
                <th className="right" style={{ width: 120 }}>Valor atual</th>
                <th className="right" style={{ width: 120 }}>P&amp;L</th>
                <th className="right" style={{ width: 100 }}>P&amp;L %</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, i) => (
                <PositionRow
                  key={position.id}
                  walletId={walletId}
                  position={position}
                  index={i}
                  onWalletUpdate={onWalletUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
