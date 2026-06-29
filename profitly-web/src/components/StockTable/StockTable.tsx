import type { StockQuote } from '../../types/StockQuote'
import { StockRow } from '../StockRow/StockRow'
import type { FilterType } from '../../hooks/useStockFIlter'
import './StockTable.css'

interface StockTableProps {
  stocks: StockQuote[]
  filter: FilterType
  onFilter: (f: FilterType) => void
}

export function StockTable({ stocks, filter, onFilter }: StockTableProps) {
  return (
    <div className="table-wrap">
      <div className="table-header">
        <span className="table-title">Stock quotes</span>
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
            <th style={{ width: 200 }}>Stock</th>
            <th className="right" style={{ width: 90 }}>Price</th>
            <th className="right" style={{ width: 90 }}>Change</th>
            <th className="right" style={{ width: 100 }}>Change %</th>
            <th className="right" style={{ width: 90 }}>Volume</th>
            <th className="right" style={{ width: 110 }}>Market cap</th>
            <th style={{ width: 130 }}>52w range</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <StockRow key={stock.symbol} stock={stock} />
          ))}
        </tbody>
      </table>
    </div>
  )
}