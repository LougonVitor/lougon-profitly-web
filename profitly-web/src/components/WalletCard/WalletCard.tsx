import type { WalletSummary } from '../../types/WalletSummary'
import { AllocationChart } from '../AllocationChart/AllocationChart'
import './WalletCard.css'

interface WalletCardProps {
  wallet: WalletSummary
  index: number
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function WalletCard({ wallet, index }: WalletCardProps) {
  const up = wallet.profitOrLoss >= 0

  return (
    <div className="wallet-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="wallet-card-body">
        <div className="wallet-card-left">
          <div className="wallet-card-name">{wallet.name}</div>

          <div className="wallet-card-stats">
            <div className="wallet-stat">
              <span className="wallet-stat-label">Invested</span>
              <span className="wallet-stat-value">{fmtBRL(wallet.totalInvested)}</span>
            </div>
            <div className="wallet-stat">
              <span className="wallet-stat-label">Current value</span>
              <span className="wallet-stat-value">{fmtBRL(wallet.currentValue)}</span>
            </div>
            <div className="wallet-stat">
              <span className="wallet-stat-label">Profit / Loss</span>
              <span className={`wallet-stat-value ${up ? 'positive' : 'negative'}`}>
                {up ? '+' : ''}{fmtBRL(wallet.profitOrLoss)}
              </span>
            </div>
            <div className="wallet-stat">
              <span className="wallet-stat-label">Return</span>
              <span className={`wallet-stat-value wallet-stat-return ${up ? 'return--up' : 'return--down'}`}>
                {up ? '↑' : '↓'} {up ? '+' : ''}{wallet.profitOrLossPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {wallet.positions.length > 0 && (
          <div className="wallet-card-right">
            <span className="wallet-chart-label">Allocation</span>
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
