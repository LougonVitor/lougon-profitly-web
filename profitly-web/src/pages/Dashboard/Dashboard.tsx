import { Header } from '../../components/Header/Header'
import { SummaryCard } from '../../components/SummaryCard/SummaryCard'
import { StockTable } from '../../components/StockTable/StockTable'
import { useTickers } from '../../hooks/useTickers'
import { useTickerFilter } from '../../hooks/useTickerFilter'
import './Dashboard.css'

export function Dashboard() {
  const { tickers, loading, error } = useTickers()
  const { filtered, filter, setFilter, search, setSearch } = useTickerFilter(tickers)

  const advancing = tickers.filter(t => (t.changePercent ?? 0) >= 0).length
  const declining = tickers.filter(t => (t.changePercent ?? 0) < 0).length

  if (loading) return <div className="dashboard-state">Loading tickers...</div>
  if (error) return <div className="dashboard-state dashboard-state--error">Error: {error}</div>

  return (
    <div className="dashboard">
      <Header search={search} onSearch={setSearch} />

      <div className="summary-grid">
        <SummaryCard label="Tickers tracked" value={tickers.length} sub="all asset types" />
        <SummaryCard label="Advancing" value={advancing} sub="↑ in the green" variant="positive" />
        <SummaryCard label="Declining" value={declining} sub="↓ in the red" variant="negative" />
        <SummaryCard label="Currency" value="BRL" sub="B3 market" />
      </div>

      <StockTable tickers={filtered} filter={filter} onFilter={setFilter} />
    </div>
  )
}
