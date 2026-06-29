import type { StockQuote } from '../../types/StockQuote'
import './StockRow.css'

interface StockRowProps {
  stock: StockQuote
}

function fmtCap(v: number | null): string {
  if (!v) return '—'
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(1)}B`
  return `R$ ${(v / 1e6).toFixed(0)}M`
}

function fmtVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return String(v)
}

function rangePos(price: number, low: number, high: number): string {
  return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100)).toFixed(1)
}

export function StockRow({ stock }: StockRowProps) {
  const up = stock.regularMarketChange >= 0
  const pos = rangePos(stock.regularMarketPrice, stock.fiftyTwoWeekLow, stock.fiftyTwoWeekHigh)

  return (
    <tr className="stock-row">
      <td>
        <div className="stock-info">
          <img
            className="stock-logo"
            src={stock.logoUrl}
            alt={`${stock.symbol} logo`}
            width={28}
            height={28}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <div className="stock-symbol">{stock.symbol}</div>
            <div className="stock-name">{stock.longName}</div>
          </div>
        </div>
      </td>
      <td className="right"><strong>R$ {stock.regularMarketPrice.toFixed(2)}</strong></td>
      <td className={`right ${up ? 'positive' : 'negative'}`}>
        {up ? '+' : ''}{stock.regularMarketChange.toFixed(2)}
      </td>
      <td className="right">
        <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
          {up ? '↑' : '↓'} {up ? '+' : ''}{stock.regularMarketChangePercent.toFixed(2)}%
        </span>
      </td>
      <td className="right muted">{fmtVol(stock.regularMarketVolume)}</td>
      <td className="right muted">{fmtCap(stock.marketCap)}</td>
      <td>
        <div className="range-price">R$ {stock.regularMarketPrice.toFixed(2)}</div>
        <div className="range-bar">
          <div className="range-fill" style={{ width: `${pos}%` }} />
        </div>
        <div className="range-labels">
          <span>{stock.fiftyTwoWeekLow.toFixed(2)}</span>
          <span>{stock.fiftyTwoWeekHigh.toFixed(2)}</span>
        </div>
      </td>
    </tr>
  )
}