import type { WalletPositionSummary } from '../../types/WalletSummary'
import './PositionRow.css'

interface PositionRowProps {
  position: WalletPositionSummary
}

function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PositionRow({ position }: PositionRowProps) {
  const up = position.profitOrLoss >= 0

  return (
    <tr className="position-row">
      <td><span className="position-ticker">{position.ticker}</span></td>
      <td className="right">{position.quantity}</td>
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
