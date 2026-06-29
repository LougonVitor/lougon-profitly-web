import type { WalletSummary } from '../../types/WalletSummary'
import './WalletCard.css'

interface WalletCardProps {
  wallet: WalletSummary
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function WalletCard({ wallet }: WalletCardProps) {
  const up = wallet.profitOrLoss >= 0

  return (
    <div className="wallet-card">
      <div className="wallet-card-name">{wallet.name}</div>

      <div className="wallet-card-grid">
        <div className="wallet-card-stat">
          <span className="wallet-card-label">Invested</span>
          <span className="wallet-card-value">{fmtBRL(wallet.totalInvested)}</span>
        </div>
        <div className="wallet-card-stat">
          <span className="wallet-card-label">Current value</span>
          <span className="wallet-card-value">{fmtBRL(wallet.currentValue)}</span>
        </div>
        <div className="wallet-card-stat">
          <span className="wallet-card-label">Profit / Loss</span>
          <span className={`wallet-card-value ${up ? 'positive' : 'negative'}`}>
            {up ? '+' : ''}{fmtBRL(wallet.profitOrLoss)}
          </span>
        </div>
        <div className="wallet-card-stat">
          <span className="wallet-card-label">Return</span>
          <span className={`wallet-card-value ${up ? 'positive' : 'negative'}`}>
            {up ? '+' : ''}{wallet.profitOrLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
