import { useNavigate } from 'react-router-dom'
import type { Ticker } from '../../types/Ticker'
import './StockRow.css'

interface StockRowProps {
  ticker: Ticker
}

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
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

export function StockRow({ ticker }: StockRowProps) {
  const navigate = useNavigate()
  const up = (ticker.changePercent ?? 0) >= 0

  return (
    <tr className="stock-row stock-row--clickable" onClick={() => navigate(`/ticker/${ticker.symbol}`)}>
      <td>
        <div className="stock-info">
          <img
            className="stock-logo"
            src={ticker.logoUrl ?? ''}
            alt={`${ticker.symbol} logo`}
            width={28}
            height={28}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <div className="stock-symbol">{ticker.symbol}</div>
            <div className="stock-name">{ticker.longName ?? ticker.name}</div>
          </div>
        </div>
      </td>
      <td className="right"><strong>{fmtBRL(ticker.lastPrice)}</strong></td>
      <td className="right">
        <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
          {up ? '↑' : '↓'} {fmtPct(ticker.changePercent)}
        </span>
      </td>
      <td className="right muted">{fmtVol(ticker.volume)}</td>
      <td className="right muted">{fmtCap(ticker.marketCap)}</td>
      <td className="muted">{ticker.subType ?? ticker.assetType ?? '—'}</td>
    </tr>
  )
}
