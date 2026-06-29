import { Header } from '../../components/Header/Header'
import { SummaryCard } from '../../components/SummaryCard/SummaryCard'
import { StockTable } from '../../components/StockTable/StockTable'
import { useStockQuotes } from '../../hooks/useStockQuotes'
import { useStockFilter } from '../../hooks/useStockFIlter'
import './Dashboard.css'

export function Dashboard() {
  const { stocks, loading, error } = useStockQuotes()
  const { filtered, filter, setFilter, search, setSearch } = useStockFilter(stocks)

  const advancing = stocks.filter(s => s.regularMarketChange >= 0).length
  const declining = stocks.filter(s => s.regularMarketChange < 0).length

  if (loading) return <div className="dashboard-state">Loading stocks...</div>
  if (error) return <div className="dashboard-state dashboard-state--error">Error: {error}</div>

  return (
    <div className="dashboard">
      <Header search={search} onSearch={setSearch} />

      <div className="summary-grid">
        <SummaryCard label="Stocks tracked" value={stocks.length} sub="equities" />
        <SummaryCard label="Advancing" value={advancing} sub="↑ in the green" variant="positive" />
        <SummaryCard label="Declining" value={declining} sub="↓ in the red" variant="negative" />
        <SummaryCard label="Currency" value="BRL" sub="B3 market" />
      </div>

      <StockTable stocks={filtered} filter={filter} onFilter={setFilter} />
    </div>
  )
}