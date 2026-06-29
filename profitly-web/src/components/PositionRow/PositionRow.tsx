import type { WalletPositionSummary } from '../../types/WalletSummary'
import './PositionRow.css'

interface PositionRowProps {
  position: WalletPositionSummary
  index: number
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PositionRow({ position, index }: PositionRowProps) {
  const up = position.profitOrLoss >= 0

  return (
    <tr className="position-row" style={{ animationDelay: `${0.15 + index * 0.06}s` }}>
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
          <span className="position-ticker">{position.ticker}</span>
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
          {up ? '↑' : '↓'} {up ? '+' : ''}{position.profitOrLossPercent.toFixed(2)}%
        </span>
      </td>
    </tr>
  )
}
