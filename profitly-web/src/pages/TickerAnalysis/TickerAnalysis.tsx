import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, LineChart, Line, CartesianGrid,
} from 'recharts'
import { useTickerAnalysis, usePriceHistory } from '../../hooks/useTickerAnalysis'
import { useStockAnalysis } from '../../hooks/useStockAnalysis'
import {
  FiftyTwoWeekRange, FinancialHighlights, SectorComparisonSection,
  CompanyProfileSection, StatementsSection, KeyIndicatorsSection,
} from './StockAdvanced'
import { useFiiIndicator, useFiiIndicatorHistory } from '../../hooks/useFiiIndicators'
import { useTreasuryBond, useTreasuryBondHistory } from '../../hooks/useTreasuryBond'
import { useFundIndicator } from '../../hooks/useFundIndicator'
import { useI18n } from '../../i18n/I18nContext'
import type { TickerAnalysis } from '../../types/TickerAnalysis'
import './TickerAnalysis.css'

// ── Helpers ─────────────────────────────────────────────────────────────────

const RANGES = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1A', value: '1y' },
  { label: '2A', value: '2y' },
  { label: '5A', value: '5y' },
  { label: '10A', value: '10y' },
  { label: 'MAX', value: 'max' },
]

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${fmt(v)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${fmt(v)}%`
}

function fmtDY(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${fmt(v * 100)}%`
}

function fmtCap(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return `R$ ${fmt(v / 1e12, 2)}T`
  if (v >= 1e9)  return `R$ ${fmt(v / 1e9, 1)}B`
  if (v >= 1e6)  return `R$ ${fmt(v / 1e6, 0)}M`
  return `R$ ${fmt(v / 1e3, 0)}k`
}

function fmtShares(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e9) return `${fmt(v / 1e9, 2)}B`
  if (v >= 1e6) return `${fmt(v / 1e6, 1)}M`
  return String(v)
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}

function fmtInvestors(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

// ── Shared Components ────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, variant }: {
  label: string; value: string; sub?: string; variant?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="ta-metric">
      <div className="ta-metric-label">{label}</div>
      <div className={`ta-metric-value ${variant ? `ta-metric-value--${variant}` : ''}`}>{value}</div>
      {sub && <div className="ta-metric-sub">{sub}</div>}
    </div>
  )
}

function computeTicks(data: { date: string | number }[], range: string): (string | number)[] {
  if (data.length === 0) return []
  const n = { '1m': 4, '3m': 3, '6m': 6, '1y': 4, '2y': 4, '5y': 5, '10y': 5, 'max': 5 }[range] ?? 5
  if (data.length <= n) return data.map(d => d.date)
  const step = Math.floor((data.length - 1) / (n - 1))
  return Array.from({ length: n }, (_, i) => data[Math.min(i * step, data.length - 1)].date)
}

function tickLabel(d: string | number, range: string): string {
  try {
    const date = new Date(d)
    if (['1m', '3m'].includes(range))
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    if (['6m', '1y', '2y'].includes(range))
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  } catch { return '' }
}

// ── Price Chart ──────────────────────────────────────────────────────────────

function PriceChartSection({ symbol }: { symbol: string }) {
  const [range, setRange] = useState('1y')
  const { history, loading } = usePriceHistory(symbol, range)

  const data = history?.prices
    .filter(p => p.close != null)
    .map(p => ({ date: p.date, close: p.close, volume: p.volume })) ?? []

  const first = data[0]?.close ?? 0
  const last = data[data.length - 1]?.close ?? 0
  const isUp = last >= first
  const strokeColor = isUp ? 'var(--text-up)' : 'var(--text-down)'
  const fillId = isUp ? 'fillUp' : 'fillDown'

  return (
    <div className="ta-chart-card">
      <div className="ta-chart-header">
        <div>
          <div className="ta-chart-title">Cotação {symbol}</div>
          {!loading && data.length > 0 && (
            <div className={`ta-chart-change ${isUp ? 'ta-chart-change--up' : 'ta-chart-change--down'}`}>
              {isUp ? '▲' : '▼'} {fmtPct(first > 0 ? ((last - first) / first) * 100 : null)} no período
            </div>
          )}
        </div>
        <div className="ta-range-btns">
          {RANGES.map(r => (
            <button
              key={r.value}
              className={`ta-range-btn ${range === r.value ? 'ta-range-btn--active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ta-chart-body">
        {loading ? (
          <div className="ta-chart-loading">Carregando gráfico...</div>
        ) : data.length === 0 ? (
          <div className="ta-chart-empty">Sem dados para este período</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fillUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--text-up)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--text-up)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--text-down)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--text-down)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                ticks={computeTicks(data, range)}
                tickFormatter={d => tickLabel(d, range)}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false} interval={0}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false} width={60}
                tickFormatter={v => `R$${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
                labelFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d } }}
                formatter={(value: unknown) => [`R$ ${Number(value).toFixed(2)}`, 'Fechamento']}
              />
              <Area type="monotone" dataKey="close" stroke={strokeColor} strokeWidth={1.5}
                fill={`url(#${fillId})`} dot={false} activeDot={{ r: 4, fill: strokeColor }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Dividend Section ─────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const DIV_RANGES = [
  { label: String(CURRENT_YEAR), key: 'ytd' },
  { label: '1A', key: '1y' },
  { label: '3A', key: '3y' },
  { label: '5A', key: '5y' },
  { label: 'MÁX', key: 'max' },
]
const DIVIDEND_PAGE_SIZE = 10

function divCutoff(key: string): Date | null {
  const now = Date.now()
  if (key === 'ytd') return new Date(CURRENT_YEAR, 0, 1)
  if (key === '1y')  return new Date(now - 1   * 365.25 * 86400000)
  if (key === '3y')  return new Date(now - 3   * 365.25 * 86400000)
  if (key === '5y')  return new Date(now - 5   * 365.25 * 86400000)
  return null
}

function divTickLabel(d: string, range: string): string {
  try {
    const date = new Date(d)
    if (range === 'ytd' || range === '1y')
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  } catch { return '' }
}

function divComputeTicks(data: { lastDatePrior?: string | null }[], range: string): string[] {
  const valid = data.filter(d => d.lastDatePrior) as { lastDatePrior: string }[]
  if (valid.length === 0) return []
  const n = { ytd: 4, '1y': 4, '3y': 4, '5y': 5, max: 5 }[range] ?? 5
  if (valid.length <= n) return valid.map(d => d.lastDatePrior)
  const step = Math.floor((valid.length - 1) / (n - 1))
  return Array.from({ length: n }, (_, i) => valid[Math.min(i * step, valid.length - 1)].lastDatePrior)
}

function DividendTable({ dividends, isPct, price }: {
  dividends: TickerAnalysis['dividends']
  isPct: boolean
  price: number
}) {
  const [page, setPage] = useState(0)
  const total = dividends.length
  const pages = Math.ceil(total / DIVIDEND_PAGE_SIZE)
  const slice = dividends.slice(page * DIVIDEND_PAGE_SIZE, (page + 1) * DIVIDEND_PAGE_SIZE)

  return (
    <div className="ta-dividends-table">
      <table>
        <thead>
          <tr>
            <th>Data com</th>
            <th>Pagamento</th>
            <th>Tipo</th>
            <th className="right">Valor (R$)</th>
            {isPct && <th className="right">DY (%)</th>}
            <th>Ref.</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((d, i) => (
            <tr key={d.lastDatePrior ?? d.paymentDate ?? i}>
              <td>{fmtDate(d.lastDatePrior)}</td>
              <td>{fmtDate(d.paymentDate)}</td>
              <td><span className="ta-div-badge">{d.label ?? '—'}</span></td>
              <td className="right ta-div-value">R$ {(d.rate ?? 0).toFixed(4)}</td>
              {isPct && (
                <td className="right ta-div-value">
                  {price > 0 ? `${(((d.rate ?? 0) / price) * 100).toFixed(2)}%` : '—'}
                </td>
              )}
              <td className="muted">{d.relatedTo ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="ta-div-pagination">
          <button className="ta-div-page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            ‹ Anterior
          </button>
          <span className="ta-div-page-info">{page + 1} / {pages}</span>
          <button className="ta-div-page-btn" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}>
            Próximo ›
          </button>
        </div>
      )}
    </div>
  )
}

function DividendSection({ analysis }: { analysis: TickerAnalysis }) {
  const [divRange, setDivRange] = useState('5y')
  const [viewMode, setViewMode] = useState<'value' | 'pct'>('pct')

  const isPct = viewMode === 'pct'
  const price = analysis.lastPrice ?? 0
  const historicalDy = analysis.historicalDyByYear ?? {}

  const all = (analysis.dividends ?? []).filter(d => d.rate != null && d.rate > 0)
  const cutoff = divCutoff(divRange)
  const dividends = cutoff ? all.filter(d => d.lastDatePrior && new Date(d.lastDatePrior) >= cutoff) : all

  const fmtDisplay = (v: number) =>
    isPct ? `${v.toFixed(2)}%` : `R$ ${v.toFixed(4)}`

  const chartData: { key: string; display: number }[] = isPct
    ? (() => {
        // Only years computed by the backend (split-adjusted dividends / year-end price).
        // No fallback to the CURRENT price — that produced wildly wrong DY for past years.
        const cutoffYear = cutoff ? cutoff.getFullYear() : null
        return Object.entries(historicalDy)
          .filter(([yr]) => cutoffYear == null || Number(yr) >= cutoffYear)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([yr, dy]) => ({ key: yr, display: dy }))
          .filter(d => d.display > 0)
      })()
    : dividends.map((d, i) => ({
        key: d.lastDatePrior ?? d.paymentDate ?? String(i),
        display: d.rate ?? 0,
      }))

  const avg = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.display, 0) / chartData.length
    : null

  if (all.length === 0) return null

  const pctTicks = chartData.map(d => d.key)
  const rawTicks = divComputeTicks(dividends, divRange)

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Histórico de Dividendos</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="ta-range-btns">
            <button className={`ta-range-btn ${viewMode === 'value' ? 'ta-range-btn--active' : ''}`} onClick={() => setViewMode('value')}>R$</button>
            <button className={`ta-range-btn ${viewMode === 'pct' ? 'ta-range-btn--active' : ''}`} onClick={() => setViewMode('pct')}>%</button>
          </div>
          <div className="ta-range-btns">
            {DIV_RANGES.map(r => (
              <button key={r.key} className={`ta-range-btn ${divRange === r.key ? 'ta-range-btn--active' : ''}`} onClick={() => setDivRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {avg != null && (
        <div className="ta-div-avg-label">
          <span className="ta-div-avg-line" /> {isPct ? 'DY médio anual' : 'Média'} do período: <strong>{fmtDisplay(avg)}</strong>
        </div>
      )}
      <div className="ta-dividends-chart">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barSize={isPct ? 32 : 14}>
            <XAxis dataKey="key" ticks={isPct ? pctTicks : rawTicks}
              tickFormatter={d => isPct ? d : (d ? divTickLabel(d, divRange) : '')}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              formatter={(v: unknown) => [fmtDisplay(Number(v)), isPct ? 'DY anual' : 'Valor']}
              labelFormatter={d => isPct ? `Ano ${d}` : (d ? new Date(d).toLocaleDateString('pt-BR') : '')}
            />
            <Bar dataKey="display" radius={[3, 3, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill="var(--accent)" opacity={0.8} />)}
            </Bar>
            {avg != null && (
              <ReferenceLine y={avg} stroke="var(--text-up)" strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: `Média ${fmtDisplay(avg)}`, position: 'insideTopRight', fontSize: 10, fill: 'var(--text-up)', dy: -4 }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DividendTable dividends={dividends} isPct={isPct} price={price} />
    </div>
  )
}

// ── FII Components ───────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<string, string> = {
  papel: 'Papel (CRI)', tijolo: 'Tijolo', hibrido: 'Híbrido', fof: 'FoF',
}

function segmentLabel(s: string | null | undefined): string {
  if (!s) return '—'
  return SEGMENT_LABEL[s.toLowerCase()] ?? s
}

const FII_HISTORY_METRICS = [
  { key: 'priceToNav',       label: 'P/VP',       fmt: (v: number) => v.toFixed(3) },
  { key: 'dividendYield12m', label: 'DY 12m (%)', fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'dividendYield1m',  label: 'DY 1m (%)',  fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'equity',           label: 'Patrimônio', fmt: (v: number) => fmtCap(v) },
]

function FiiHistorySection({ symbol }: { symbol: string }) {
  const { history, loading } = useFiiIndicatorHistory(symbol)
  const [metric, setMetric] = useState(FII_HISTORY_METRICS[0])

  if (loading) return null
  if (history.length === 0) return null

  const chartData = history
    .filter(h => h[metric.key as keyof typeof h] != null)
    .map(h => ({
      date: h.referenceDate.substring(0, 7),
      value: h[metric.key as keyof typeof h] as number,
    }))

  if (chartData.length < 2) return null

  const ticks = (() => {
    if (chartData.length <= 6) return chartData.map(d => d.date)
    const n = 6
    const step = Math.floor((chartData.length - 1) / (n - 1))
    return Array.from({ length: n }, (_, i) => chartData[Math.min(i * step, chartData.length - 1)].date)
  })()

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Indicadores Históricos</div>
        <div className="ta-range-btns">
          {FII_HISTORY_METRICS.map(m => (
            <button key={m.key} className={`ta-range-btn ${metric.key === m.key ? 'ta-range-btn--active' : ''}`} onClick={() => setMetric(m)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ta-chart-body" style={{ marginTop: '0.75rem' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" ticks={ticks}
              tickFormatter={d => { try { return new Date(d + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) } catch { return d } }}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={55}
              tickFormatter={v => metric.fmt(v)}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              labelFormatter={d => { try { return new Date(d + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) } catch { return d } }}
              formatter={(v: unknown) => [metric.fmt(Number(v)), metric.label]}
            />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Full FII analysis page layout */
function FiiAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { indicator, loading: indLoading } = useFiiIndicator(analysis.symbol)
  const up = (analysis.changePercent ?? 0) >= 0

  const pvp = indicator?.priceToNav
  const pvpVariant = pvp == null ? undefined : pvp < 1 ? 'up' : pvp > 1.2 ? 'down' : 'neutral'

  return (
    <>
      {/* FII Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--fii">
        {indLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ta-metric ta-metric--skeleton" />
          ))
        ) : (
          <>
            <MetricCard
              label="P/VP"
              value={fmt(pvp)}
              sub="Preço / Valor Patrimonial"
              variant={pvpVariant}
            />
            <MetricCard
              label="DY 12m"
              value={indicator?.dividendYield12m != null ? `${indicator.dividendYield12m.toFixed(2)}%` : '—'}
              sub="Dividend Yield anual"
              variant={indicator?.dividendYield12m != null && indicator.dividendYield12m > 8 ? 'up' : undefined}
            />
            <MetricCard
              label="DY 1m"
              value={indicator?.dividendYield1m != null ? `${indicator.dividendYield1m.toFixed(2)}%` : '—'}
              sub="Dividend Yield mensal"
            />
            <MetricCard
              label="Cotistas"
              value={fmtInvestors(indicator?.totalInvestors)}
              sub="Total de investidores"
            />
            <MetricCard
              label="Patrimônio"
              value={fmtCap(indicator?.equity)}
              sub="Patrimônio Líquido"
            />
            <MetricCard
              label="Segmento"
              value={segmentLabel(indicator?.segmentType)}
              sub="Tipo de fundo"
            />
          </>
        )}
      </div>

      {/* Price Chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* FII Detail Cards */}
      <div className="ta-info-grid">
        {/* Market data */}
        <div className="ta-section-card">
          <div className="ta-section-title">Dados de Mercado</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Preço atual</span><strong>{fmtBRL(analysis.lastPrice)}</strong></div>
            <div className="ta-info-row"><span>Variação hoje</span>
              <strong className={up ? 'up' : 'down'}>{fmtPct(analysis.changePercent)}</strong>
            </div>
            <div className="ta-info-row"><span>Volume</span><strong>{fmtCap(analysis.volume)}</strong></div>
            <div className="ta-info-row"><span>Valor de Mercado</span><strong>{fmtCap(analysis.marketCap)}</strong></div>
            <div className="ta-info-row"><span>Cotas em circulação</span><strong>{fmtShares(analysis.sharesOutstanding)}</strong></div>
            {analysis.weekChange52 != null && (
              <div className="ta-info-row"><span>Variação 52 semanas</span><strong>{fmtPct(analysis.weekChange52 * 100)}</strong></div>
            )}
          </div>
        </div>

        {/* FII Fundamentals */}
        <div className="ta-section-card">
          <div className="ta-section-title">Sobre o Fundo</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>P/VP</span>
              <strong className={pvpVariant === 'up' ? 'up' : pvpVariant === 'down' ? 'down' : ''}>{fmt(pvp)}</strong>
            </div>
            <div className="ta-info-row"><span>DY 12 meses</span>
              <strong className="up">{indicator?.dividendYield12m != null ? `${indicator.dividendYield12m.toFixed(2)}%` : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>DY 1 mês</span>
              <strong>{indicator?.dividendYield1m != null ? `${indicator.dividendYield1m.toFixed(2)}%` : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>Retorno Mensal</span>
              <strong>{indicator?.monthlyReturn != null ? `${indicator.monthlyReturn.toFixed(2)}%` : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>Patrimônio Líquido</span><strong>{fmtCap(indicator?.equity)}</strong></div>
            <div className="ta-info-row"><span>Ativo Total</span><strong>{fmtCap(indicator?.totalAssets)}</strong></div>
            <div className="ta-info-row"><span>Segmento</span><strong>{segmentLabel(indicator?.segmentType)}</strong></div>
            <div className="ta-info-row"><span>Total Cotistas</span><strong>{fmtInvestors(indicator?.totalInvestors)}</strong></div>
          </div>
        </div>
      </div>

      {/* Administrator */}
      {indicator?.adminName && (
        <div className="ta-fii-admin-card">
          <div className="ta-fii-admin-icon">🏦</div>
          <div>
            <div className="ta-fii-admin-label">Administrador</div>
            <div className="ta-fii-admin-name">{indicator.adminName}</div>
            {indicator.adminCnpj && (
              <div className="ta-fii-admin-cnpj">CNPJ: {indicator.adminCnpj}</div>
            )}
          </div>
        </div>
      )}

      {/* Historical indicators chart */}
      <FiiHistorySection symbol={analysis.symbol} />

      {/* Dividends */}
      <DividendSection analysis={analysis} />
    </>
  )
}

/** Crypto analysis page layout */
function CryptoAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const up = (analysis.changePercent ?? 0) >= 0

  return (
    <>
      {/* Crypto Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--crypto">
        <MetricCard
          label="Market Cap"
          value={fmtCap(analysis.marketCap)}
          sub="Capitalização de mercado"
        />
        <MetricCard
          label="Volume 24h"
          value={fmtCap(analysis.volume)}
          sub="Volume em 24 horas"
        />
        <MetricCard
          label="Var. dia"
          value={fmtPct(analysis.changePercent)}
          sub="Variação em 24h"
          variant={up ? 'up' : 'down'}
        />
        <MetricCard
          label="52 semanas"
          value={analysis.weekChange52 != null ? fmtPct(analysis.weekChange52 * 100) : '—'}
          sub="Retorno anual"
          variant={analysis.weekChange52 != null ? (analysis.weekChange52 >= 0 ? 'up' : 'down') : undefined}
        />
      </div>

      {/* Price Chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* Market Data */}
      <div className="ta-section-card">
        <div className="ta-section-title">Dados de Mercado</div>
        <div className="ta-info-rows">
          <div className="ta-info-row"><span>Preço atual</span><strong>{fmtBRL(analysis.lastPrice)}</strong></div>
          <div className="ta-info-row"><span>Variação hoje</span>
            <strong className={up ? 'up' : 'down'}>{fmtPct(analysis.changePercent)}</strong>
          </div>
          <div className="ta-info-row"><span>Volume 24h</span><strong>{fmtCap(analysis.volume)}</strong></div>
          <div className="ta-info-row"><span>Market Cap</span><strong>{fmtCap(analysis.marketCap)}</strong></div>
          {analysis.weekChange52 != null && (
            <div className="ta-info-row"><span>Variação 52 semanas</span>
              <strong className={analysis.weekChange52 >= 0 ? 'up' : 'down'}>{fmtPct(analysis.weekChange52 * 100)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Dividends (staking rewards etc.) */}
      <DividendSection analysis={analysis} />
    </>
  )
}

/** Full stock analysis page layout */
function StockAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const up = (analysis.changePercent ?? 0) >= 0
  const { data: advanced } = useStockAnalysis(analysis.symbol)

  return (
    <>
      {/* Stock Metrics Bar */}
      <div className="ta-metrics-bar">
        <MetricCard label="P/L" value={fmt(analysis.trailingPE)} sub="Preço / Lucro" />
        <MetricCard label="P/VP" value={fmt(analysis.priceToBook)} sub="Preço / Val. Patrim." />
        <MetricCard
          label="DY"
          value={fmtDY(analysis.dividendYield)}
          sub="Dividend Yield"
          variant={analysis.dividendYield != null && analysis.dividendYield > 0.05 ? 'up' : undefined}
        />
        <MetricCard label="Beta" value={fmt(analysis.beta)} sub="Volatilidade relativa" />
        <MetricCard label="LPA" value={fmtBRL(analysis.earningsPerShare)} sub="Lucro por Ação" />
        <MetricCard label="EV/EBITDA" value={fmt(analysis.enterpriseToEbitda)} sub="Enterprise / EBITDA" />
        <MetricCard label="EV/Receita" value={fmt(analysis.enterpriseToRevenue)} sub="Enterprise / Receita" />
        <MetricCard label="Margem" value={fmtDY(analysis.profitMargins)} sub="Margem Líquida" />
      </div>

      {/* Price Chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* Market data */}
      <div className="ta-section-card">
          <div className="ta-section-title">Dados de Mercado</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Preço atual</span><strong>{fmtBRL(analysis.lastPrice)}</strong></div>
            <div className="ta-info-row"><span>Variação dia</span>
              <strong className={up ? 'up' : 'down'}>{fmtPct(analysis.changePercent)}</strong>
            </div>
            <div className="ta-info-row"><span>Volume</span><strong>{fmtCap(analysis.volume)}</strong></div>
            <div className="ta-info-row"><span>Valor de Mercado</span><strong>{fmtCap(analysis.marketCap)}</strong></div>
            <div className="ta-info-row"><span>Valor Patrimonial</span><strong>{fmtBRL(analysis.bookValue)}</strong></div>
            <div className="ta-info-row"><span>Ações em circulação</span><strong>{fmtShares(analysis.sharesOutstanding)}</strong></div>
            {analysis.floatShares != null && (
              <div className="ta-info-row"><span>Free float</span><strong>{fmtShares(analysis.floatShares)}</strong></div>
            )}
            <div className="ta-info-row"><span>Enterprise Value</span><strong>{fmtCap(analysis.enterpriseValue)}</strong></div>
          </div>
      </div>

      {/* 52-week range */}
      <FiftyTwoWeekRange quote={advanced?.quote ?? null} />

      {/* Investidor10-style fundamental indicator grid */}
      <KeyIndicatorsSection indicators={advanced?.keyIndicators ?? null} />

      {/* Profitability, margins, debt and cash */}
      <FinancialHighlights financials={advanced?.financials ?? null} />

      {/* Company vs sector average */}
      <SectorComparisonSection comparison={advanced?.sectorComparison ?? null} />

      {/* Dividends */}
      <DividendSection analysis={analysis} />

      {/* Financial statements: DRE, balance sheet, cash flow, DVA */}
      <StatementsSection symbol={analysis.symbol} />

      {/* About the company */}
      <CompanyProfileSection profile={advanced?.profile ?? null} />
    </>
  )
}

// ── Treasury Components ──────────────────────────────────────────────────────

const TREASURY_HISTORY_METRICS = [
  { key: 'buyRate',  label: 'Taxa compra (%)', fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'sellRate', label: 'Taxa venda (%)',  fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'buyPrice', label: 'Preço compra',    fmt: (v: number) => `R$ ${v.toFixed(2)}` },
]

function TreasuryHistorySection({ symbol }: { symbol: string }) {
  const { history, loading } = useTreasuryBondHistory(symbol)
  const [metric, setMetric] = useState(TREASURY_HISTORY_METRICS[0])

  if (loading || history.length < 2) return null

  const chartData = history
    .filter(h => h[metric.key as keyof typeof h] != null)
    .map(h => ({
      date: h.referenceDate.substring(0, 10),
      value: h[metric.key as keyof typeof h] as number,
    }))

  if (chartData.length < 2) return null

  const n = 6
  const step = Math.floor((chartData.length - 1) / (n - 1))
  const ticks = Array.from({ length: n }, (_, i) => chartData[Math.min(i * step, chartData.length - 1)].date)

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Histórico de Taxas</div>
        <div className="ta-range-btns">
          {TREASURY_HISTORY_METRICS.map(m => (
            <button key={m.key} className={`ta-range-btn ${metric.key === m.key ? 'ta-range-btn--active' : ''}`} onClick={() => setMetric(m)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ta-chart-body" style={{ marginTop: '0.75rem' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" ticks={ticks}
              tickFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) } catch { return d } }}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={65}
              tickFormatter={v => metric.fmt(v)}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              labelFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d } }}
              formatter={(v: unknown) => [metric.fmt(Number(v)), metric.label]}
            />
            <Line type="monotone" dataKey="value" stroke="var(--ta-treasury-accent, #6366f1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TreasuryAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { bond, loading } = useTreasuryBond(analysis.symbol)

  const fmtRate = (v: number | null | undefined) => v != null ? `${v.toFixed(2)}%` : '—'
  const fmtDuration = (days: number | null | undefined) => {
    if (days == null) return '—'
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    return years > 0 ? `${years}a ${months}m` : `${months}m`
  }

  const indexerLabel: Record<string, string> = {
    selic: 'SELIC', ipca: 'IPCA', pre: 'Prefixado', igpm: 'IGP-M',
  }

  const couponLabel: Record<string, string> = {
    zero: 'Zero cupom', semiannual: 'Semestral',
  }

  return (
    <>
      {/* Treasury Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--treasury">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="ta-metric ta-metric--skeleton" />)
        ) : (
          <>
            <MetricCard label="Taxa Compra" value={fmtRate(bond?.buyRate)} sub="Rentabilidade anual" variant="up" />
            <MetricCard label="Taxa Venda" value={fmtRate(bond?.sellRate)} sub="Rentabilidade atual" />
            <MetricCard label="Preço Compra" value={bond?.buyPrice != null ? `R$ ${bond.buyPrice.toFixed(2)}` : '—'} sub="Valor unitário" />
            <MetricCard label="Vencimento" value={bond?.maturityDate ? fmtDate(bond.maturityDate) : '—'} sub="Data de resgate" />
          </>
        )}
      </div>

      {/* Detail cards */}
      <div className="ta-info-grid">
        <div className="ta-section-card">
          <div className="ta-section-title">Dados do Título</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Tipo</span><strong>{bond?.bondType ?? '—'}</strong></div>
            <div className="ta-info-row"><span>Indexador</span>
              <strong>{bond?.indexer ? (indexerLabel[bond.indexer.toLowerCase()] ?? bond.indexer) : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>Cupom</span>
              <strong>{bond?.couponType ? (couponLabel[bond.couponType.toLowerCase()] ?? bond.couponType) : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>Vencimento</span><strong>{bond?.maturityDate ? fmtDate(bond.maturityDate) : '—'}</strong></div>
            <div className="ta-info-row"><span>Duration</span><strong>{fmtDuration(bond?.durationDays)}</strong></div>
          </div>
        </div>

        <div className="ta-section-card">
          <div className="ta-section-title">Preços e Taxas</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Taxa de compra</span><strong className="up">{fmtRate(bond?.buyRate)}</strong></div>
            <div className="ta-info-row"><span>Taxa de venda</span><strong>{fmtRate(bond?.sellRate)}</strong></div>
            <div className="ta-info-row"><span>Preço de compra</span><strong>{bond?.buyPrice != null ? `R$ ${bond.buyPrice.toFixed(2)}` : '—'}</strong></div>
            <div className="ta-info-row"><span>Preço de venda</span><strong>{bond?.sellPrice != null ? `R$ ${bond.sellPrice.toFixed(2)}` : '—'}</strong></div>
            <div className="ta-info-row"><span>Preço base</span><strong>{bond?.basePrice != null ? `R$ ${bond.basePrice.toFixed(2)}` : '—'}</strong></div>
          </div>
        </div>
      </div>

      {/* Historical rate chart */}
      <TreasuryHistorySection symbol={analysis.symbol} />
    </>
  )
}

// ── Fund Components ──────────────────────────────────────────────────────────

const FUND_TYPE_LABELS: Record<string, string> = {
  fiagro: 'FIAGRO', fidc: 'FIDC', fip: 'FIP', 'fi-infra': 'FI-Infra',
}

function FundAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { indicator, loading } = useFundIndicator(analysis.symbol)
  const up = (analysis.changePercent ?? 0) >= 0

  const pvp = indicator?.priceToNav
  const pvpVariant = pvp == null ? undefined : pvp < 1 ? 'up' : pvp > 1.2 ? 'down' : 'neutral'
  const fundTypeLabel = indicator?.fundType
    ? (FUND_TYPE_LABELS[indicator.fundType.toLowerCase()] ?? indicator.fundType)
    : '—'

  return (
    <>
      {/* Fund Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--fund">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="ta-metric ta-metric--skeleton" />)
        ) : (
          <>
            <MetricCard label="P/VP" value={fmt(pvp)} sub="Preço / Valor Patrimonial" variant={pvpVariant} />
            <MetricCard
              label="DY 12m"
              value={indicator?.dividendYield12m != null ? `${indicator.dividendYield12m.toFixed(2)}%` : '—'}
              sub="Dividend Yield anual"
              variant={indicator?.dividendYield12m != null && indicator.dividendYield12m > 8 ? 'up' : undefined}
            />
            <MetricCard
              label="DY 1m"
              value={indicator?.dividendYield1m != null ? `${indicator.dividendYield1m.toFixed(2)}%` : '—'}
              sub="Dividend Yield mensal"
            />
            <MetricCard label="Cotistas" value={fmtInvestors(indicator?.totalInvestors)} sub="Total de investidores" />
            <MetricCard label="Tipo" value={fundTypeLabel} sub="Categoria do fundo" />
          </>
        )}
      </div>

      {/* Price Chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* Detail Cards */}
      <div className="ta-info-grid">
        <div className="ta-section-card">
          <div className="ta-section-title">Dados de Mercado</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Preço atual</span><strong>{fmtBRL(analysis.lastPrice)}</strong></div>
            <div className="ta-info-row"><span>Variação hoje</span>
              <strong className={up ? 'up' : 'down'}>{fmtPct(analysis.changePercent)}</strong>
            </div>
            <div className="ta-info-row"><span>Volume</span><strong>{fmtCap(analysis.volume)}</strong></div>
            <div className="ta-info-row"><span>Valor de Mercado</span><strong>{fmtCap(analysis.marketCap)}</strong></div>
            <div className="ta-info-row"><span>Total de Cotistas</span><strong>{fmtInvestors(indicator?.totalInvestors)}</strong></div>
          </div>
        </div>

        <div className="ta-section-card">
          <div className="ta-section-title">Sobre o Fundo</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Tipo de fundo</span><strong>{fundTypeLabel}</strong></div>
            <div className="ta-info-row"><span>P/VP</span>
              <strong className={pvpVariant === 'up' ? 'up' : pvpVariant === 'down' ? 'down' : ''}>{fmt(pvp)}</strong>
            </div>
            <div className="ta-info-row"><span>DY 12 meses</span>
              <strong className="up">{indicator?.dividendYield12m != null ? `${indicator.dividendYield12m.toFixed(2)}%` : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>DY 1 mês</span>
              <strong>{indicator?.dividendYield1m != null ? `${indicator.dividendYield1m.toFixed(2)}%` : '—'}</strong>
            </div>
            <div className="ta-info-row"><span>VPA (Nav/cota)</span><strong>{fmtBRL(indicator?.navPerShare)}</strong></div>
            {indicator?.segmentType && (
              <div className="ta-info-row"><span>Segmento</span><strong>{indicator.segmentType}</strong></div>
            )}
          </div>
        </div>
      </div>

      {indicator?.adminName && (
        <div className="ta-fii-admin-card">
          <div className="ta-fii-admin-icon">🏦</div>
          <div>
            <div className="ta-fii-admin-label">Administrador</div>
            <div className="ta-fii-admin-name">{indicator.adminName}</div>
            {indicator.adminCnpj && (
              <div className="ta-fii-admin-cnpj">CNPJ: {indicator.adminCnpj}</div>
            )}
          </div>
        </div>
      )}

      {/* Dividends */}
      <DividendSection analysis={analysis} />
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function TickerAnalysis() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { analysis, loading, error } = useTickerAnalysis(symbol ?? '')

  if (loading) {
    return (
      <div className="ta-page">
        <div className="ta-state">Carregando análise...</div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="ta-page">
        <div className="ta-state ta-state--error">{error ?? 'Ticker não encontrado'}</div>
      </div>
    )
  }

  const up = (analysis.changePercent ?? 0) >= 0
  const assetTypeLower = (analysis.assetType ?? '').toLowerCase()
  const subTypeLower = (analysis.subType ?? '').toLowerCase()
  const isFii = ['fii'].includes(assetTypeLower) || ['fii'].includes(subTypeLower)
  const isCrypto = ['crypto', 'cryptocurrency'].includes(assetTypeLower)
  const isTreasury = ['treasury', 'tesouro'].includes(assetTypeLower) || analysis.symbol?.startsWith('tesouro-')
  const isFund = ['fiagro', 'fidc', 'fip', 'fi-infra', 'fund'].includes(assetTypeLower)
    || ['fiagro', 'fidc', 'fip', 'fi-infra', 'fund'].includes(subTypeLower)

  const assetLabel = (t.assetType as Record<string, string>)[
    (analysis.subType ?? analysis.assetType ?? '').toLowerCase()
  ] ?? (analysis.subType ?? analysis.assetType ?? '')

  return (
    <div className="ta-page">
      {/* Breadcrumb */}
      <nav className="ta-breadcrumb">
        <button className="ta-breadcrumb-btn" onClick={() => navigate('/')}>{t.nav.tickers}</button>
        <span className="ta-sep">›</span>
        {assetLabel && <><span className="ta-breadcrumb-part">{assetLabel}</span><span className="ta-sep">›</span></>}
        <span className="ta-breadcrumb-active">{analysis.symbol}</span>
      </nav>

      {/* Hero */}
      <div className={`ta-hero ${isFii ? 'ta-hero--fii' : isCrypto ? 'ta-hero--crypto' : isTreasury ? 'ta-hero--treasury' : isFund ? 'ta-hero--fund' : ''}`}>
        <div className="ta-hero-left">
          <div className="ta-logo-wrap">
            <img
              className="ta-logo"
              src={analysis.logoUrl ?? ''}
              alt={analysis.symbol}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div>
            <div className="ta-hero-top">
              <h1 className="ta-symbol">{analysis.symbol}</h1>
              {assetLabel && <span className="ta-type-badge">{assetLabel}</span>}
            </div>
            <div className="ta-long-name">{analysis.longName ?? analysis.name}</div>
            {analysis.sector && <div className="ta-sector">{analysis.sector}</div>}
          </div>
        </div>
        <div className="ta-hero-right">
          <div className="ta-price">{fmtBRL(analysis.lastPrice)}</div>
          <div className={`ta-day-change ${up ? 'ta-day-change--up' : 'ta-day-change--down'}`}>
            {up ? '▲' : '▼'} {fmtPct(analysis.changePercent)} <span className="ta-day-label">hoje</span>
          </div>
          {analysis.weekChange52 != null && (
            <div className="ta-52w">52 sem: {fmtPct(analysis.weekChange52 * 100)}</div>
          )}
        </div>
      </div>

      {/* Asset-specific content */}
      {isFii
        ? <FiiAnalysisPage analysis={analysis} />
        : isCrypto
          ? <CryptoAnalysisPage analysis={analysis} />
          : isTreasury
            ? <TreasuryAnalysisPage analysis={analysis} />
            : isFund
              ? <FundAnalysisPage analysis={analysis} />
              : <StockAnalysisPage analysis={analysis} />
      }
    </div>
  )
}
