import { useState, type ReactElement } from 'react'
import type { WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { PositionRow } from '../PositionRow/PositionRow'
import { useI18n } from '../../i18n/I18nContext'
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
  return `${v >= 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}%`
}

/* ---- SVG Icons ---- */
function StockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
}

function FiiIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="18" height="11" rx="1" />
    <path d="M12 3L2 10h20L12 3z" />
    <rect x="9" y="14" width="6" height="7" />
  </svg>
}

function EtfIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
}

function BdrIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
}

function UnitIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M7 10l3 3 3-3 4 4" />
  </svg>
}

function InfraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
}

function AgroIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 19c1.43 2 3.94 2.01 5.18 0C10.74 16.23 13.24 15.21 17 15" />
    <path d="M2 12c0 6 4 8 8 8" />
    <path d="M17 3v15M17 3c0 0 4 4 4 9" />
  </svg>
}

function FipIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
}

function FidcIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
}

function OtherIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
}

function TreasuryIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M4 18h16M6 10v8M10 10v8M14 10v8M18 10v8" />
    <path d="M12 3L3 8h18l-9-5z" />
  </svg>
}

function CryptoIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 8h4a2 2 0 1 1 0 4H9h4.5a2 2 0 1 1 0 4H9" />
    <path d="M10 6v2M10 16v2M13 6v2M13 16v2" />
  </svg>
}

function FixedIncomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M12 9v6M9.5 10.5a2.5 2.5 0 0 1 2.5-1.5h1a1.75 1.75 0 0 1 0 3.5h-1a1.75 1.75 0 0 0 0 3.5h1a2.5 2.5 0 0 0 2.5-1.5" />
  </svg>
}

function FundIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
}

const ICON_MAP: Record<string, () => ReactElement> = {
  treasury: TreasuryIcon,
  crypto: CryptoIcon,
  fund: FundIcon,
  stock: StockIcon,
  unit: UnitIcon,
  fii: FiiIcon,
  etf: EtfIcon,
  bdr: BdrIcon,
  'fi-infra': InfraIcon,
  'fi-agro': AgroIcon,
  fip: FipIcon,
  fidc: FidcIcon,
  'fixed-income': FixedIncomeIcon,
}

function AssetIcon({ assetType }: { assetType: string }) {
  const Icon = ICON_MAP[assetType.toLowerCase()] ?? OtherIcon
  return (
    <div className={`asset-icon asset-icon--${assetType.toLowerCase().replace('-', '_')}`}>
      <Icon />
    </div>
  )
}

export function AssetTypeCard({
  walletId, label, assetType, positions, portfolioCurrentValue, onWalletUpdate,
}: AssetTypeCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const totalCurrentValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0)
  const totalInvested = positions.reduce((s, p) => s + (p.totalInvested ?? 0), 0)
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
            <span className="asset-stat-label">{t.wallet.assets(positions.length).split(' ')[1] ? t.wallet.positions : t.wallet.positions}</span>
            <span className="asset-stat-value">{positions.length}</span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">{t.wallet.currentValue}</span>
            <span className="asset-stat-value">{fmtBRL(totalCurrentValue)}</span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">{t.wallet.return}</span>
            <span className={`asset-stat-value asset-stat-value--${isUp ? 'up' : 'down'}`}>
              {fmtPct(pnlPercent)}
            </span>
          </div>
          <div className="asset-stat">
            <span className="asset-stat-label">% {t.nav.wallet}</span>
            <span className="asset-stat-value">{portfolioPercent.toFixed(1).replace('.', ',')}%</span>
          </div>
        </div>

        <span className={`asset-card-chevron ${expanded ? 'asset-card-chevron--open' : ''}`}>▾</span>
      </button>

      {expanded && (
        <div className="asset-card-body">
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>{t.position.ticker}</th>
                <th className="right" style={{ width: 60 }}>{t.position.qty}</th>
                <th className="right" style={{ width: 110 }}>{t.position.avgPrice}</th>
                <th className="right" style={{ width: 120 }}>{t.position.currentPrice}</th>
                <th className="right" style={{ width: 120 }}>{t.position.invested}</th>
                <th className="right" style={{ width: 120 }}>{t.position.currentValue}</th>
                <th className="right" style={{ width: 120 }}>{t.position.pnl}</th>
                <th className="right" style={{ width: 100 }}>{t.position.pnlPct}</th>
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
