import { Header } from '../../components/Header/Header'
import { SummaryCard } from '../../components/SummaryCard/SummaryCard'
import { StockTable } from '../../components/StockTable/StockTable'
import { useTickers } from '../../hooks/useTickers'
import { useTickerFilter } from '../../hooks/useTickerFilter'
import { useI18n } from '../../i18n/I18nContext'
import './Dashboard.css'

export function Dashboard() {
  const { tickers, loading, error } = useTickers()
  const { filtered, filter, setFilter, search, setSearch } = useTickerFilter(tickers)
  const { t } = useI18n()

  const advancing = tickers.filter(t => (t.changePercent ?? 0) >= 0).length
  const declining = tickers.filter(t => (t.changePercent ?? 0) < 0).length

  if (loading) return <div className="dashboard-state">{t.dashboard.loading}</div>
  if (error) return <div className="dashboard-state dashboard-state--error">Error: {error}</div>

  return (
    <div className="dashboard">
      <Header search={search} onSearch={setSearch} />

      <div className="summary-grid">
        <SummaryCard label={t.dashboard.tickersTracked} value={tickers.length} sub={t.dashboard.allAssetTypes} />
        <SummaryCard label={t.dashboard.advancing} value={advancing} sub={t.dashboard.inTheGreen} variant="positive" />
        <SummaryCard label={t.dashboard.declining} value={declining} sub={t.dashboard.inTheRed} variant="negative" />
        <SummaryCard label={t.dashboard.currency} value="BRL" sub={t.dashboard.market} />
      </div>

      <StockTable tickers={filtered} filter={filter} onFilter={setFilter} />
    </div>
  )
}
