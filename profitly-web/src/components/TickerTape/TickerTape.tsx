import { useNavigate } from 'react-router-dom'
import { useTickers } from '../../hooks/useTickers'
import type { Ticker } from '../../types/Ticker'
import { TickerLogo } from '../TickerLogo/TickerLogo'
import './TickerTape.css'

const FEATURED_SYMBOLS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'ABEV3', 'WEGE3',
  'BBDC4', 'MGLU3', 'KLBN11', 'TAEE11', 'CSAN3', 'PETR3',
  'BPAC11', 'RENT3', 'LREN3', 'RADL3', 'SUZB3', 'JBSS3',
]

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

interface TapeItemProps {
  ticker: Ticker
}

function TapeItem({ ticker }: TapeItemProps) {
  const navigate = useNavigate()
  const up = (ticker.changePercent ?? 0) >= 0

  return (
    <button
      className="tape-item"
      onClick={() => navigate(`/ticker/${ticker.symbol}`)}
    >
      <TickerLogo
        className="tape-logo"
        src={ticker.logoUrl}
        alt={ticker.symbol}
      />
      <span className="tape-symbol">{ticker.symbol}</span>
      <span className="tape-price">{fmtBRL(ticker.lastPrice)}</span>
      <span className={`tape-change ${up ? 'tape-change--up' : 'tape-change--down'}`}>
        {up ? '▲' : '▼'} {fmtPct(ticker.changePercent)}
      </span>
    </button>
  )
}

export function TickerTape() {
  const { tickers } = useTickers()

  const featured = FEATURED_SYMBOLS
    .map(s => tickers.find(t => t.symbol === s))
    .filter((t): t is Ticker => t != null)

  if (featured.length === 0) return null

  const doubled = [...featured, ...featured]

  return (
    <div className="ticker-tape">
      <div className="ticker-tape-track" style={{ '--item-count': featured.length } as React.CSSProperties}>
        {doubled.map((tk, i) => (
          <TapeItem key={`${tk.symbol}-${i}`} ticker={tk} />
        ))}
      </div>
    </div>
  )
}
