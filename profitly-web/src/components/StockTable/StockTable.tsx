import type { Ticker } from '../../types/Ticker'
import { StockRow } from '../StockRow/StockRow'
import type { FilterType } from '../../hooks/useTickerFilter'
import './StockTable.css'

interface StockTableProps {
  tickers: Ticker[]
  filter: FilterType
  onFilter: (f: FilterType) => void
}

export function StockTable({ tickers, filter, onFilter }: StockTableProps) {
  return (
    <div className="table-wrap">
      <div className="table-header">
        <span className="table-title">Tickers</span>
        <div className="filter-row">
          {(['all', 'up', 'down'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              onClick={() => onFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'up' ? 'Advancing' : 'Declining'}
            </button>
          ))}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 200 }}>Ticker</th>
            <th className="right" style={{ width: 90 }}>Price</th>
            <th className="right" style={{ width: 100 }}>Change %</th>
            <th className="right" style={{ width: 90 }}>Volume</th>
            <th className="right" style={{ width: 110 }}>Market cap</th>
            <th style={{ width: 100 }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {tickers.map(t => (
            <StockRow key={t.symbol} ticker={t} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
