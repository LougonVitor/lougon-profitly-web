import type { Ticker } from '../../types/Ticker'
import { StockRow } from '../StockRow/StockRow'
import type { FilterType } from '../../hooks/useTickerFilter'
import { useI18n } from '../../i18n/I18nContext'
import './StockTable.css'

interface StockTableProps {
  tickers: Ticker[]
  filter: FilterType
  onFilter: (f: FilterType) => void
}

export function StockTable({ tickers, filter, onFilter }: StockTableProps) {
  const { t } = useI18n()

  return (
    <div className="table-wrap">
      <div className="table-header">
        <span className="table-title">{t.nav.tickers}</span>
        <div className="filter-row">
          {(['all', 'up', 'down'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              onClick={() => onFilter(f)}
            >
              {f === 'all' ? t.filter.all : f === 'up' ? t.filter.advancing : t.filter.declining}
            </button>
          ))}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 220 }}>{t.position.ticker}</th>
            <th className="right" style={{ width: 110 }}>{t.position.currentPrice}</th>
            <th className="right" style={{ width: 110 }}>Variação</th>
            <th className="right" style={{ width: 110 }}>Volume</th>
            <th className="right" style={{ width: 130 }}>Mkt Cap</th>
            <th style={{ width: 90 }}>Tipo</th>
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
