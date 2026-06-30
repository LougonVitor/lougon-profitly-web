import type { StockQuote } from '../../types/StockQuote'
import './StockRow.css'

interface StockRowProps {
  stock: StockQuote
}

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtChange(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtCap(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `R$ ${(v / 1e9).toFixed(1)}B`
  return `R$ ${(v / 1e6).toFixed(0)}M`
}

function fmtVol(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return String(v)
}

function rangePos(price: number | null, low: number | null, high: number | null): string | null {
  if (price == null || low == null || high == null || high === low) return null
  return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100)).toFixed(1)
}

export function StockRow({ stock }: StockRowProps) {
  const up = (stock.regularMarketChange ?? 0) >= 0
  const pos = rangePos(stock.regularMarketPrice, stock.fiftyTwoWeekLow, stock.fiftyTwoWeekHigh)

  return (
    <tr className="stock-row">
      <td>
        <div className="stock-info">
          <img
            className="stock-logo"
            src={stock.logoUrl ?? ''}
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
      <td className="right"><strong>{fmtBRL(stock.regularMarketPrice)}</strong></td>
      <td className={`right ${up ? 'positive' : 'negative'}`}>
        {fmtChange(stock.regularMarketChange)}
      </td>
      <td className="right">
        <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
          {up ? '↑' : '↓'} {fmtPct(stock.regularMarketChangePercent)}
        </span>
      </td>
      <td className="right muted">{fmtVol(stock.regularMarketVolume)}</td>
      <td className="right muted">{fmtCap(stock.marketCap)}</td>
      <td>
        {pos != null ? (
          <>
            <div className="range-price">{fmtBRL(stock.regularMarketPrice)}</div>
            <div className="range-bar">
              <div className="range-fill" style={{ width: `${pos}%` }} />
            </div>
            <div className="range-labels">
              <span>{stock.fiftyTwoWeekLow?.toFixed(2)}</span>
              <span>{stock.fiftyTwoWeekHigh?.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
    </tr>
  )
}
