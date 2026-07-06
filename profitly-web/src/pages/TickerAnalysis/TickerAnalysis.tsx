import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, LineChart, Line, CartesianGrid,
} from 'recharts'
import { useTickerAnalysis, usePriceHistory } from '../../hooks/useTickerAnalysis'
import { useStockAnalysis } from '../../hooks/useStockAnalysis'
import {
  FiftyTwoWeekRange, FinancialHighlights, SectorComparisonSection,
  CompanyProfileSection, StatementsSection, KeyIndicatorsSection, UpcomingDividends,
  GrahamCard,
} from './StockAdvanced'
import { useFiiIndicator, useFiiIndicatorHistory } from '../../hooks/useFiiIndicators'
import { useTreasuryBondHistory } from '../../hooks/useTreasuryBond'
import { useTreasuryAnalysis } from '../../hooks/useTreasuryAnalysis'
import { useFundAnalysis } from '../../hooks/useFundAnalysis'
import { useCryptoAnalysis } from '../../hooks/useCryptoAnalysis'
import { useFearGreed } from '../../hooks/useFearGreed'
import { useI18n } from '../../i18n/I18nContext'
import type { TickerAnalysis } from '../../types/TickerAnalysis'
import type { CryptoAnalysis } from '../../types/CryptoAnalysis'
import type { TreasuryAnalysis as TreasuryAnalysisData } from '../../types/TreasuryAnalysis'
import type { FundAnalysis as FundAnalysisData, FundRawDocument } from '../../types/FundAnalysis'
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

function MetricCard({ label, value, sub, variant, help }: {
  label: string; value: string; sub?: string; variant?: 'up' | 'down' | 'neutral'; help?: string
}) {
  return (
    <div className="ta-metric">
      {help && (
        <span className="ta-metric-help" tabIndex={0} aria-label={help}>
          ?
          <span className="ta-metric-help-tip">{help}</span>
        </span>
      )}
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

interface IbovBenchmark {
  points: { date: number; close: number }[]
}

/** Benchmark series (IBOV) for comparison mode — served from the ibovespa cache. */
function useIbovBenchmark(range: string, enabled: boolean) {
  const [points, setPoints] = useState<Map<string, number> | null>(null)

  useEffect(() => {
    if (!enabled) return
    let active = true
    setPoints(null)
    api.get<IbovBenchmark>(`/api/ibovespa?range=${range}`)
      .then(res => {
        if (!active) return
        const map = new Map<string, number>()
        for (const p of res.data.points ?? []) {
          if (p.close == null) continue
          map.set(new Date(p.date * 1000).toISOString().slice(0, 10), p.close)
        }
        setPoints(map)
      })
      .catch(() => { if (active) setPoints(new Map()) })
    return () => { active = false }
  }, [range, enabled])

  return points
}

function PriceChartSection({ symbol, showBenchmark = true, currencyToggle = false }: {
  symbol: string
  /** Hides the "vs IBOV" comparison button when false (e.g. crypto). */
  showBenchmark?: boolean
  /** Shows a BRL/USD switch; USD reads the "{symbol}:USD" series from price_points. */
  currencyToggle?: boolean
}) {
  const [range, setRange] = useState('1y')
  const [vsIbov, setVsIbov] = useState(false)
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL')
  const inUsd = currencyToggle && currency === 'USD'
  const { history, loading } = usePriceHistory(inUsd ? `${symbol}:USD` : symbol, range)
  const ibovPoints = useIbovBenchmark(range, showBenchmark && vsIbov)
  const cur = inUsd ? 'US$' : 'R$'

  const data = history?.prices
    .filter(p => p.close != null)
    .map(p => ({ date: p.date, close: p.close, volume: p.volume })) ?? []

  const first = data[0]?.close ?? 0
  const last = data[data.length - 1]?.close ?? 0
  const isUp = last >= first
  const strokeColor = isUp ? 'var(--text-up)' : 'var(--text-down)'
  const fillId = isUp ? 'fillUp' : 'fillDown'

  // Comparison mode: both series normalized to % change since period start,
  // IBOV carried forward on days without an index point (holidays/mismatched calendars)
  const compareData = (() => {
    if (!vsIbov || data.length === 0 || !ibovPoints || ibovPoints.size === 0) return []
    let ibovFirst: number | null = null
    let lastKnown: number | null = null
    const rows: { date: string; stock: number; ibov: number | null }[] = []
    for (const p of data) {
      const iv = ibovPoints.get(String(p.date).slice(0, 10))
      if (iv != null) lastKnown = iv
      if (ibovFirst == null && lastKnown != null) ibovFirst = lastKnown
      rows.push({
        date: String(p.date),
        stock: first > 0 ? ((p.close! - first) / first) * 100 : 0,
        ibov: lastKnown != null && ibovFirst != null && ibovFirst > 0
          ? ((lastKnown - ibovFirst) / ibovFirst) * 100
          : null,
      })
    }
    return rows
  })()

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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {currencyToggle && (
            <div className="ta-range-btns">
              {(['BRL', 'USD'] as const).map(c => (
                <button
                  key={c}
                  className={`ta-range-btn ${currency === c ? 'ta-range-btn--active' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {showBenchmark && (
            <div className="ta-range-btns">
              <button
                className={`ta-range-btn ${vsIbov ? 'ta-range-btn--active' : ''}`}
                onClick={() => setVsIbov(v => !v)}
              >
                vs IBOV
              </button>
            </div>
          )}
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
      </div>
      <div className="ta-chart-body">
        {loading ? (
          <div className="ta-chart-loading">Carregando gráfico...</div>
        ) : data.length === 0 ? (
          <div className="ta-chart-empty">Sem dados para este período</div>
        ) : vsIbov ? (
          compareData.length === 0 ? (
            <div className="ta-chart-loading">Carregando IBOV...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={compareData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  ticks={computeTicks(compareData, range) as string[]}
                  tickFormatter={d => tickLabel(d, range)}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false} interval={0}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => `${Number(v).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d } }}
                  formatter={(value: unknown, name: unknown) => [`${Number(value).toFixed(2)}%`, name === 'stock' ? symbol : 'IBOV']}
                />
                <Line type="monotone" dataKey="stock" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="ibov" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )
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
                tickFormatter={v => `${cur}${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
                labelFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d } }}
                formatter={(value: unknown) => [`${cur} ${Number(value).toFixed(2)}`, 'Fechamento']}
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
  const [rawPage, setPage] = useState(0)
  const total = dividends.length
  const pages = Math.max(1, Math.ceil(total / DIVIDEND_PAGE_SIZE))
  // clamp: switching the period filter can leave the stored page beyond the last one
  const page = Math.min(rawPage, pages - 1)
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
          {/* multiple events can share the same ex-date — key must be the global row index,
              otherwise React reconciles pages incorrectly and stale rows pile up */}
          {slice.map((d, i) => (
            <tr key={page * DIVIDEND_PAGE_SIZE + i}>
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
          <button className="ta-div-page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
            ‹ Anterior
          </button>
          <span className="ta-div-page-info">{page + 1} / {pages}</span>
          <button className="ta-div-page-btn" onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page === pages - 1}>
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
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
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
const CRYPTO_RETURN_PERIODS: { key: string; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '1m', label: '1 mês' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: 'ytd', label: 'No ano' },
  { key: '1y', label: '1 ano' },
  { key: '2y', label: '2 anos' },
  { key: 'max', label: 'Máx' },
]

function fmtUSD(v: number | null | undefined): string {
  if (v == null) return '—'
  return `US$ ${fmt(v)}`
}

/** Formats a date-only string (yyyy-MM-dd) without the UTC-midnight timezone shift. */
function fmtDateOnly(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return day && m && y ? `${day}/${m}/${y}` : d
}

function pctVariant(v: number | null | undefined): 'up' | 'down' | undefined {
  if (v == null) return undefined
  return v >= 0 ? 'up' : 'down'
}

const FNG_LABELS: Record<string, string> = {
  'Extreme Fear': 'Medo Extremo',
  'Fear': 'Medo',
  'Neutral': 'Neutro',
  'Greed': 'Ganância',
  'Extreme Greed': 'Ganância Extrema',
}

function fngLabel(classification: string | null, value: number): string {
  if (classification && FNG_LABELS[classification]) return FNG_LABELS[classification]
  if (value < 25) return 'Medo Extremo'
  if (value < 45) return 'Medo'
  if (value < 55) return 'Neutro'
  if (value < 75) return 'Ganância'
  return 'Ganância Extrema'
}

function fngColor(value: number): string {
  if (value < 25) return '#d95c5c'
  if (value < 45) return '#f59e0b'
  if (value < 55) return '#eab308'
  if (value < 75) return '#84cc16'
  return '#22c55e'
}

/** Crypto Fear & Greed Index gauge (market-wide sentiment, shown on the BTC page). */
function CryptoFearGreedSection() {
  const { readings } = useFearGreed(35)
  if (readings.length === 0) return null

  const current = readings[readings.length - 1]
  const at = (daysAgo: number) => {
    const target = new Date()
    target.setDate(target.getDate() - daysAgo)
    const key = target.toISOString().slice(0, 10)
    return readings.filter(r => r.date <= key).at(-1) ?? null
  }
  const yesterday = at(1)
  const weekAgo = at(7)
  const monthAgo = at(30)

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Fear &amp; Greed (mercado cripto)</div>
      <div className="ta-fng-current">
        <span className="ta-fng-value" style={{ color: fngColor(current.value) }}>{current.value}</span>
        <span className="ta-fng-class" style={{ color: fngColor(current.value) }}>
          {fngLabel(current.classification, current.value)}
        </span>
      </div>
      <div className="ta-fng-gauge">
        <span className="ta-fng-bound">0</span>
        <div className="ta-fng-track">
          <div className="ta-fng-marker" style={{ left: `${current.value}%` }} />
        </div>
        <span className="ta-fng-bound">100</span>
      </div>
      <div className="ta-info-rows">
        {yesterday && yesterday !== current && (
          <div className="ta-info-row"><span>Ontem</span>
            <strong style={{ color: fngColor(yesterday.value) }}>
              {yesterday.value} — {fngLabel(yesterday.classification, yesterday.value)}
            </strong></div>
        )}
        {weekAgo && (
          <div className="ta-info-row"><span>Há 7 dias</span>
            <strong style={{ color: fngColor(weekAgo.value) }}>
              {weekAgo.value} — {fngLabel(weekAgo.classification, weekAgo.value)}
            </strong></div>
        )}
        {monthAgo && (
          <div className="ta-info-row"><span>Há 30 dias</span>
            <strong style={{ color: fngColor(monthAgo.value) }}>
              {monthAgo.value} — {fngLabel(monthAgo.classification, monthAgo.value)}
            </strong></div>
        )}
      </div>
    </div>
  )
}

/** 52-week range bar for crypto, reusing the stock range-bar styles. */
function Crypto52WeekRange({ crypto }: { crypto: CryptoAnalysis }) {
  if (crypto.low52w == null || crypto.high52w == null || crypto.price == null) return null
  const pct = crypto.positionInRange52w
    ?? (crypto.high52w > crypto.low52w
      ? Math.min(100, Math.max(0, ((crypto.price - crypto.low52w) / (crypto.high52w - crypto.low52w)) * 100))
      : 50)

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Faixa de 52 Semanas</div>
      <div className="ta-52w">
        <span className="ta-52w-bound">{fmtBRL(crypto.low52w)}</span>
        <div className="ta-52w-track">
          <div className="ta-52w-fill" style={{ width: `${pct}%` }} />
          <div className="ta-52w-marker" style={{ left: `${pct}%` }}>
            <span className="ta-52w-price">{fmtBRL(crypto.price)}</span>
          </div>
        </div>
        <span className="ta-52w-bound">{fmtBRL(crypto.high52w)}</span>
      </div>
    </div>
  )
}

function CryptoReturnsSection({ crypto }: { crypto: CryptoAnalysis }) {
  const returns = crypto.returns
  if (!returns || Object.keys(returns).length === 0) return null
  const periods = CRYPTO_RETURN_PERIODS.filter(p => returns[p.key] != null)
  if (periods.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Retornos</div>
      <div className="ta-crypto-returns-grid">
        {periods.map(p => (
          <MetricCard key={p.key} label={p.label} value={fmtPct(returns[p.key])}
            variant={pctVariant(returns[p.key])} />
        ))}
      </div>
    </div>
  )
}

function CryptoRiskSection({ crypto }: { crypto: CryptoAnalysis }) {
  const hasData = crypto.volatility30d != null || crypto.volatility1y != null
    || crypto.maxDrawdown1y != null
  if (!hasData) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Risco e Volatilidade</div>
      <div className="ta-info-rows">
        {crypto.volatility30d != null && (
          <div className="ta-info-row"><span>Volatilidade 30 dias (anualizada)</span>
            <strong>{fmt(crypto.volatility30d)}%</strong></div>
        )}
        {crypto.volatility1y != null && (
          <div className="ta-info-row"><span>Volatilidade 1 ano (anualizada)</span>
            <strong>{fmt(crypto.volatility1y)}%</strong></div>
        )}
        {crypto.maxDrawdown1y != null && (
          <div className="ta-info-row"><span>Queda máxima em 1 ano (drawdown)</span>
            <strong className="down">{fmt(crypto.maxDrawdown1y)}%</strong></div>
        )}
        {crypto.positionInRange52w != null && (
          <div className="ta-info-row"><span>Posição na faixa de 52 semanas</span>
            <strong>{fmt(crypto.positionInRange52w, 0)}%</strong></div>
        )}
      </div>
    </div>
  )
}

function CryptoAthSection({ crypto }: { crypto: CryptoAnalysis }) {
  if (crypto.athPrice == null) return null
  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Máxima Histórica</div>
      <div className="ta-info-rows">
        <div className="ta-info-row"><span>Preço máximo histórico (fechamento)</span>
          <strong>{fmtBRL(crypto.athPrice)}</strong></div>
        {crypto.athDate && (
          <div className="ta-info-row"><span>Data da máxima</span>
            <strong>{fmtDateOnly(crypto.athDate)}</strong></div>
        )}
        {crypto.distanceFromAthPercent != null && (
          <div className="ta-info-row"><span>Distância da máxima</span>
            <strong className={crypto.distanceFromAthPercent >= 0 ? 'up' : 'down'}>
              {fmtPct(crypto.distanceFromAthPercent)}
            </strong></div>
        )}
        {crypto.historyStart && crypto.historyDays != null && (
          <div className="ta-info-row"><span>Histórico disponível desde</span>
            <strong>{fmtDateOnly(crypto.historyStart)} ({crypto.historyDays} dias)</strong></div>
        )}
      </div>
    </div>
  )
}

function CryptoMovingAveragesSection({ crypto }: { crypto: CryptoAnalysis }) {
  if (crypto.sma50 == null && crypto.sma200 == null) return null
  const goldenCross = crypto.sma50 != null && crypto.sma200 != null
    ? crypto.sma50 > crypto.sma200 : null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Médias Móveis</div>
      <div className="ta-info-rows">
        {crypto.sma50 != null && (
          <div className="ta-info-row"><span>Média móvel 50 dias</span>
            <strong>{fmtBRL(crypto.sma50)}</strong></div>
        )}
        {crypto.priceVsSma50Percent != null && (
          <div className="ta-info-row"><span>Preço vs. média de 50 dias</span>
            <strong className={crypto.priceVsSma50Percent >= 0 ? 'up' : 'down'}>
              {fmtPct(crypto.priceVsSma50Percent)}
            </strong></div>
        )}
        {crypto.sma200 != null && (
          <div className="ta-info-row"><span>Média móvel 200 dias</span>
            <strong>{fmtBRL(crypto.sma200)}</strong></div>
        )}
        {crypto.priceVsSma200Percent != null && (
          <div className="ta-info-row"><span>Preço vs. média de 200 dias</span>
            <strong className={crypto.priceVsSma200Percent >= 0 ? 'up' : 'down'}>
              {fmtPct(crypto.priceVsSma200Percent)}
            </strong></div>
        )}
        {goldenCross != null && (
          <div className="ta-info-row"><span>Tendência (cruzamento 50/200)</span>
            <strong className={goldenCross ? 'up' : 'down'}>
              {goldenCross ? 'Alta (golden cross)' : 'Baixa (death cross)'}
            </strong></div>
        )}
      </div>
    </div>
  )
}

function CryptoAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { data: crypto, loading } = useCryptoAnalysis(analysis.symbol)
  const changePercent = crypto?.changePercent ?? analysis.changePercent
  const up = (changePercent ?? 0) >= 0
  const return1y = crypto?.returns?.['1y']

  return (
    <>
      {/* Crypto Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--crypto">
        <MetricCard
          label="Var. 24h"
          value={fmtPct(changePercent)}
          sub={crypto?.changeValue != null ? fmtBRL(crypto.changeValue) : 'Variação em 24h'}
          variant={up ? 'up' : 'down'}
        />
        <MetricCard
          label="Volume 24h"
          value={fmtCap(crypto?.volume24h ?? analysis.volume)}
          sub="Volume em 24 horas"
          help="Valor total negociado nas últimas 24 horas, em reais."
        />
        <MetricCard
          label="Retorno 1a"
          value={fmtPct(return1y)}
          sub="Últimos 12 meses"
          variant={pctVariant(return1y)}
        />
        <MetricCard
          label="Volatilidade"
          value={crypto?.volatility1y != null ? `${fmt(crypto.volatility1y, 0)}%` : '—'}
          sub="Anualizada (1 ano)"
          help="Desvio padrão anualizado dos retornos diários do último ano. Quanto maior, mais o preço oscila."
        />
        <MetricCard
          label="Ranking"
          value={crypto?.volumeRank != null ? `#${crypto.volumeRank}` : '—'}
          sub={crypto?.totalCoins != null ? `de ${crypto.totalCoins} por volume` : 'Por volume'}
          help="Posição entre as criptomoedas disponíveis, ordenadas pelo volume negociado em 24h."
        />
      </div>

      {/* Price Chart — no IBOV benchmark, BRL/USD switch */}
      <PriceChartSection symbol={analysis.symbol} showBenchmark={false} currencyToggle />

      {/* Fear & Greed Index (market-wide, shown on the BTC page) */}
      {analysis.symbol === 'BTC' && <CryptoFearGreedSection />}

      {/* 52-week range */}
      {crypto && <Crypto52WeekRange crypto={crypto} />}

      {/* Period returns */}
      {crypto && <CryptoReturnsSection crypto={crypto} />}

      <div className="ta-info-grid">
        {/* Risk */}
        {crypto && <CryptoRiskSection crypto={crypto} />}

        {/* All-time high */}
        {crypto && <CryptoAthSection crypto={crypto} />}

        {/* Moving averages */}
        {crypto && <CryptoMovingAveragesSection crypto={crypto} />}

        {/* Market Data */}
        <div className="ta-section-card">
          <div className="ta-section-title">Dados de Mercado</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Preço atual</span>
              <strong>{fmtBRL(crypto?.price ?? analysis.lastPrice)}</strong></div>
            {crypto?.priceUsd != null && (
              <div className="ta-info-row"><span>Preço em dólar</span>
                <strong>{fmtUSD(crypto.priceUsd)}</strong></div>
            )}
            {crypto?.usdToBrlRate != null && (
              <div className="ta-info-row"><span>Câmbio usado (USD/BRL)</span>
                <strong>{fmt(crypto.usdToBrlRate, 4)}</strong></div>
            )}
            <div className="ta-info-row"><span>Variação hoje</span>
              <strong className={up ? 'up' : 'down'}>{fmtPct(changePercent)}</strong>
            </div>
            {crypto?.dayLow != null && crypto?.dayHigh != null && (
              <div className="ta-info-row"><span>Mínima / máxima do dia</span>
                <strong>{fmtBRL(crypto.dayLow)} — {fmtBRL(crypto.dayHigh)}</strong></div>
            )}
            <div className="ta-info-row"><span>Volume 24h</span>
              <strong>{fmtCap(crypto?.volume24h ?? analysis.volume)}</strong></div>
            {crypto?.marketTime && (
              <div className="ta-info-row"><span>Última cotação</span>
                <strong>{new Date(crypto.marketTime).toLocaleString('pt-BR')}</strong></div>
            )}
          </div>
        </div>
      </div>

      {!crypto && !loading && (
        <div className="ta-section-card">
          <div className="ta-section-title">Análise avançada</div>
          <div className="ta-info-rows">
            <div className="ta-info-row">
              <span>Sem dados de análise para esta moeda ainda — aguarde o próximo sync.</span>
            </div>
          </div>
        </div>
      )}

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
        <MetricCard label="P/L" value={fmt(analysis.trailingPE)} sub="Preço / Lucro"
          help="Preço dividido pelo lucro por ação dos últimos 12 meses. Indica quantos anos de lucro o mercado paga pela ação — quanto menor, mais barata." />
        <MetricCard label="P/VP" value={fmt(analysis.priceToBook)} sub="Preço / Val. Patrim."
          help="Preço dividido pelo valor patrimonial por ação. Abaixo de 1, a ação negocia por menos que o patrimônio líquido da empresa." />
        <MetricCard
          label="DY"
          value={fmtDY(analysis.dividendYield)}
          sub="Dividend Yield"
          variant={analysis.dividendYield != null && analysis.dividendYield > 0.05 ? 'up' : undefined}
          help="Percentual do preço da ação distribuído em dividendos e JCP nos últimos 12 meses."
        />
        <MetricCard label="Beta" value={fmt(analysis.beta)} sub="Volatilidade relativa"
          help="Volatilidade em relação ao mercado. Acima de 1, a ação oscila mais que o Ibovespa; abaixo de 1, oscila menos." />
        <MetricCard label="LPA" value={fmtBRL(analysis.earningsPerShare)} sub="Lucro por Ação"
          help="Lucro líquido dos últimos 12 meses dividido pelo número de ações." />
        <MetricCard label="EV/EBITDA" value={fmt(analysis.enterpriseToEbitda)} sub="Enterprise / EBITDA"
          help="Valor da firma (mercado + dívida líquida) dividido pelo EBITDA. Quanto menor, mais barata a empresa em relação à geração de caixa operacional." />
        <MetricCard label="EV/Receita" value={fmt(analysis.enterpriseToRevenue)} sub="Enterprise / Receita"
          help="Valor da firma (mercado + dívida líquida) dividido pela receita total dos últimos 12 meses." />
        <MetricCard label="Margem" value={fmtDY(analysis.profitMargins)} sub="Margem Líquida"
          help="Percentual da receita que se converte em lucro líquido." />
      </div>

      {/* 1. Price chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* 2. Fair price models */}
      <GrahamCard indicators={advanced?.keyIndicators ?? null} quote={advanced?.quote ?? null} />

      {/* 3. 52-week range */}
      <FiftyTwoWeekRange quote={advanced?.quote ?? null} />

      {/* 4. Investidor10-style fundamental indicator grid */}
      <KeyIndicatorsSection symbol={analysis.symbol} indicators={advanced?.keyIndicators ?? null} />

      {/* 5. Company vs sector average */}
      <SectorComparisonSection comparison={advanced?.sectorComparison ?? null} />

      {/* 4. Upcoming dividends + dividend history */}
      <UpcomingDividends dividends={advanced?.dividends ?? null} />
      <DividendSection analysis={analysis} />

      {/* 5. Market data + debt/cash side by side */}
      <div className="ta-info-grid">
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

        <FinancialHighlights financials={advanced?.financials ?? null} />
      </div>

      {/* 7. Financial statements: DRE, balance sheet, cash flow, DVA */}
      <StatementsSection symbol={analysis.symbol} />

      {/* 8. About the company */}
      <CompanyProfileSection profile={advanced?.profile ?? null} />
    </>
  )
}

// ── Treasury Components ──────────────────────────────────────────────────────

const TREASURY_INDEXER_LABEL: Record<string, string> = {
  selic: 'SELIC', ipca: 'IPCA', pre: 'Prefixado', prefixado: 'Prefixado', igpm: 'IGP-M',
}

const TREASURY_COUPON_LABEL: Record<string, string> = {
  zero: 'Zero cupom', semiannual: 'Semestral', semestral: 'Semestral',
}

const TREASURY_PERIODS: { key: string; label: string }[] = [
  { key: '1m', label: '1 mês' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '1y', label: '1 ano' },
  { key: 'max', label: 'Máx' },
]

/** Years between the first income payment and maturity: Renda+ pays 240 monthly
 *  installments (19 years), Educa+ pays 60 (4 years). Official names use the START year. */
function treasuryIncomeYears(bondType: string | null | undefined): number {
  const t = (bondType ?? '').toLowerCase()
  if (t.includes('renda+')) return 19
  if (t.includes('educa+')) return 4
  return 0
}

/** Official display name: bondType + naming year (income start for Renda+/Educa+). */
function treasuryDisplayName(bondType: string | null, symbol: string, maturityDate: string | null): string {
  const base = bondType ?? symbol
  if (!bondType || !maturityDate || maturityDate.length < 4) return base
  const year = parseInt(maturityDate.slice(0, 4), 10)
  if (Number.isNaN(year)) return base
  return `${base} ${year - treasuryIncomeYears(bondType)}`
}

/** e.g. ipca → "IPCA + 7,50%", selic → "SELIC + 0,08%", prefixado → "12,50% a.a." */
function treasuryRateLabel(indexer: string | null | undefined, rate: number | null | undefined): string {
  if (rate == null) return '—'
  const pct = `${fmt(rate)}%`
  switch ((indexer ?? '').toLowerCase()) {
    case 'selic': return `SELIC + ${pct}`
    case 'ipca': return `IPCA + ${pct}`
    case 'igpm': return `IGP-M + ${pct}`
    default: return `${pct} a.a.`
  }
}

function fmtRatePct(v: number | null | undefined): string {
  return v != null ? `${fmt(v)}%` : '—'
}

/** Percentage-point delta, signed: "+0,25 p.p." */
function fmtPP(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${fmt(v)} p.p.`
}

function fmtChartPrice(v: number): string {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(1)} mil` : `R$ ${v.toFixed(0)}`
}

const TREASURY_CHART_METRICS: { key: string; label: string; fmt: (v: number) => string }[] = [
  { key: 'buyRate',  label: 'Taxa compra', fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'sellRate', label: 'Taxa venda',  fmt: (v: number) => `${v.toFixed(2)}%` },
  { key: 'buyPrice', label: 'Preço compra', fmt: fmtChartPrice },
  { key: 'sellPrice', label: 'Preço venda', fmt: fmtChartPrice },
]

const TREASURY_CHART_RANGES: { key: string; label: string; months: number | null }[] = [
  { key: '3m', label: '3M', months: 3 },
  { key: '6m', label: '6M', months: 6 },
  { key: '1y', label: '1A', months: 12 },
  { key: '2y', label: '2A', months: 24 },
  { key: 'max', label: 'Máx', months: null },
]

function TreasuryHistorySection({ symbol }: { symbol: string }) {
  const { history, loading } = useTreasuryBondHistory(symbol)
  const [metric, setMetric] = useState(TREASURY_CHART_METRICS[0])
  const [range, setRange] = useState(TREASURY_CHART_RANGES[2])

  if (loading || history.length < 2) return null

  let cutoffKey: string | null = null
  if (range.months != null) {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - range.months)
    cutoffKey = cutoff.toISOString().slice(0, 10)
  }

  const chartData = history
    .filter(h => h[metric.key as keyof typeof h] != null)
    .map(h => ({
      date: h.referenceDate.substring(0, 10),
      value: h[metric.key as keyof typeof h] as number,
    }))
    .filter(d => cutoffKey == null || d.date >= cutoffKey)

  if (chartData.length < 2) return null

  const n = 6
  const step = Math.floor((chartData.length - 1) / (n - 1))
  const ticks = Array.from({ length: n }, (_, i) => chartData[Math.min(i * step, chartData.length - 1)].date)

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Histórico de Taxas e Preços</div>
        <div className="ta-range-btns">
          {TREASURY_CHART_METRICS.map(m => (
            <button key={m.key} className={`ta-range-btn ${metric.key === m.key ? 'ta-range-btn--active' : ''}`} onClick={() => setMetric(m)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ta-range-btns" style={{ marginTop: '0.5rem' }}>
        {TREASURY_CHART_RANGES.map(r => (
          <button key={r.key} className={`ta-range-btn ${range.key === r.key ? 'ta-range-btn--active' : ''}`} onClick={() => setRange(r)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="ta-chart-body" style={{ marginTop: '0.75rem' }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" ticks={ticks}
              tickFormatter={d => { try { return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) } catch { return d } }}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={70}
              domain={['auto', 'auto']}
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

/** 52-week buyRate range bar, reusing the stock range-bar styles. */
function TreasuryRateRange({ ta }: { ta: TreasuryAnalysisData }) {
  if (ta.rate52wLow == null || ta.rate52wHigh == null || ta.buyRate == null) return null
  const pct = ta.ratePositionInRange52w
    ?? (ta.rate52wHigh > ta.rate52wLow
      ? Math.min(100, Math.max(0, ((ta.buyRate - ta.rate52wLow) / (ta.rate52wHigh - ta.rate52wLow)) * 100))
      : 50)

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Taxa de Compra — Faixa de 52 Semanas</div>
      <div className="ta-52w">
        <span className="ta-52w-bound">{fmtRatePct(ta.rate52wLow)}</span>
        <div className="ta-52w-track">
          <div className="ta-52w-fill" style={{ width: `${pct}%` }} />
          <div className="ta-52w-marker" style={{ left: `${pct}%` }}>
            <span className="ta-52w-price">{fmtRatePct(ta.buyRate)}</span>
          </div>
        </div>
        <span className="ta-52w-bound">{fmtRatePct(ta.rate52wHigh)}</span>
      </div>
      <div className="ta-sector-note">
        Quanto mais perto do topo da faixa, maior a taxa contratada hoje em relação ao último ano — historicamente um ponto de entrada mais atrativo.
      </div>
    </div>
  )
}

function TreasuryRateChangesSection({ ta }: { ta: TreasuryAnalysisData }) {
  const changes = ta.rateChanges
  if (!changes || Object.keys(changes).length === 0) return null
  const periods = TREASURY_PERIODS.filter(p => changes[p.key] != null)
  if (periods.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Variação da Taxa de Compra</div>
      <div className="ta-crypto-returns-grid ta-returns-grid--inset">
        {periods.map(p => (
          <MetricCard key={p.key} label={p.label} value={fmtPP(changes[p.key])}
            variant={pctVariant(changes[p.key])} />
        ))}
      </div>
      <div className="ta-sector-note">
        Variação em pontos percentuais da taxa de compra. Taxa subindo favorece quem vai comprar agora; para quem já tem o título, derruba o preço na marcação a mercado.
      </div>
    </div>
  )
}

function TreasuryReturnsSection({ ta }: { ta: TreasuryAnalysisData }) {
  const returns = ta.priceReturns
  if (!returns || Object.keys(returns).length === 0) return null
  const periods = TREASURY_PERIODS.filter(p => returns[p.key] != null)
  if (periods.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Retornos (marcação a mercado)</div>
      <div className="ta-crypto-returns-grid ta-returns-grid--inset">
        {periods.map(p => (
          <MetricCard key={p.key} label={p.label} value={fmtPct(returns[p.key])}
            variant={pctVariant(returns[p.key])} />
        ))}
      </div>
      <div className="ta-sector-note">
        Valorização do preço de venda antecipada no período — o retorno de quem vendesse hoje, não a rentabilidade contratada até o vencimento.
      </div>
    </div>
  )
}

function TreasuryRiskSection({ ta }: { ta: TreasuryAnalysisData }) {
  const hasData = ta.priceVolatility1y != null || ta.maxDrawdown1y != null
    || ta.ratePositionInRange52w != null || ta.rateSpread != null
  if (!hasData) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Risco e Volatilidade</div>
      <div className="ta-info-rows">
        {ta.priceVolatility1y != null && (
          <div className="ta-info-row"><span>Volatilidade do preço 1 ano (anualizada)</span>
            <strong>{fmt(ta.priceVolatility1y)}%</strong></div>
        )}
        {ta.maxDrawdown1y != null && (
          <div className="ta-info-row"><span>Queda máxima em 1 ano (drawdown)</span>
            <strong className="down">{fmt(ta.maxDrawdown1y)}%</strong></div>
        )}
        {ta.ratePositionInRange52w != null && (
          <div className="ta-info-row"><span>Posição da taxa na faixa de 52 semanas</span>
            <strong>{fmt(ta.ratePositionInRange52w, 0)}%</strong></div>
        )}
        {ta.rateSpread != null && (
          <div className="ta-info-row"><span>Spread compra/venda</span>
            <strong>{fmtPP(ta.rateSpread)}</strong></div>
        )}
      </div>
    </div>
  )
}

function TreasuryExtremesSection({ ta }: { ta: TreasuryAnalysisData }) {
  if (ta.rateHistoryHigh == null && ta.rateHistoryLow == null) return null
  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Extremos Históricos da Taxa</div>
      <div className="ta-info-rows">
        {ta.rateHistoryHigh != null && (
          <div className="ta-info-row"><span>Maior taxa de compra registrada</span>
            <strong className="up">{fmtRatePct(ta.rateHistoryHigh)}</strong></div>
        )}
        {ta.rateHistoryHighDate && (
          <div className="ta-info-row"><span>Data da maior taxa</span>
            <strong>{fmtDateOnly(ta.rateHistoryHighDate)}</strong></div>
        )}
        {ta.rateHistoryLow != null && (
          <div className="ta-info-row"><span>Menor taxa de compra registrada</span>
            <strong className="down">{fmtRatePct(ta.rateHistoryLow)}</strong></div>
        )}
        {ta.rateHistoryLowDate && (
          <div className="ta-info-row"><span>Data da menor taxa</span>
            <strong>{fmtDateOnly(ta.rateHistoryLowDate)}</strong></div>
        )}
        {ta.historyStart && ta.historyDays != null && (
          <div className="ta-info-row"><span>Histórico disponível desde</span>
            <strong>{fmtDateOnly(ta.historyStart)} ({ta.historyDays} pregões)</strong></div>
        )}
      </div>
    </div>
  )
}

/** All bonds sharing the indexer, ordered by maturity, current one highlighted. */
function TreasurySimilarBondsSection({ ta }: { ta: TreasuryAnalysisData }) {
  const navigate = useNavigate()
  if (!ta.similarBonds || ta.similarBonds.length === 0) return null

  const rows = [
    {
      symbol: ta.symbol, bondType: ta.bondType, couponType: ta.couponType,
      maturityDate: ta.maturityDate, buyRate: ta.buyRate, sellRate: ta.sellRate,
      buyPrice: ta.buyPrice, isCurrent: true,
    },
    ...ta.similarBonds.map(b => ({ ...b, isCurrent: false })),
  ].sort((a, b) => (a.maturityDate ?? '').localeCompare(b.maturityDate ?? ''))

  const indexerName = ta.indexer
    ? (TREASURY_INDEXER_LABEL[ta.indexer.toLowerCase()] ?? ta.indexer)
    : ''

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Comparação de Títulos do Mesmo Indexador</div>
        <span className="ta-sector-badge">{indexerName} · {rows.length} títulos</span>
      </div>
      <div className="ta-sector-table-wrap">
        <table className="ta-sector-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Vencimento</th>
              <th className="right">Taxa compra</th>
              <th className="right">Taxa venda</th>
              <th className="right">Preço compra</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.symbol}
                style={b.isCurrent ? undefined : { cursor: 'pointer' }}
                onClick={b.isCurrent ? undefined : () => navigate(`/ticker/${b.symbol}`)}>
                <td className={b.isCurrent ? 'ta-sector-company' : undefined}>
                  {treasuryDisplayName(b.bondType, b.symbol, b.maturityDate)}
                  {b.isCurrent ? ' (este)' : ''}
                </td>
                <td>{fmtDateOnly(b.maturityDate)}</td>
                <td className="right">{treasuryRateLabel(ta.indexer, b.buyRate)}</td>
                <td className="right">{treasuryRateLabel(ta.indexer, b.sellRate)}</td>
                <td className="right">{b.buyPrice != null ? fmtBRL(b.buyPrice) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ta-sector-note">
        Clique em um título para abrir a análise dele.
      </div>
    </div>
  )
}

function TreasuryAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { data: ta, loading } = useTreasuryAnalysis(analysis.symbol)

  const fmtDuration = (days: number | null | undefined) => {
    if (days == null) return '—'
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    return years > 0 ? `${years}a ${months}m` : `${months}m`
  }

  const return1y = ta?.priceReturns?.['1y']
  const indexerName = ta?.indexer
    ? (TREASURY_INDEXER_LABEL[ta.indexer.toLowerCase()] ?? ta.indexer)
    : null

  // Renda+/Educa+: maturity is the LAST payment; income starts years earlier
  const incomeYears = treasuryIncomeYears(ta?.bondType)
  const maturityYear = ta?.maturityDate ? parseInt(ta.maturityDate.slice(0, 4), 10) : NaN
  const incomeStartYear = incomeYears > 0 && !Number.isNaN(maturityYear) ? maturityYear - incomeYears : null

  return (
    <>
      {/* Treasury Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--treasury">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="ta-metric ta-metric--skeleton" />)
        ) : (
          <>
            <MetricCard
              label="Taxa Compra"
              value={treasuryRateLabel(ta?.indexer, ta?.buyRate)}
              sub={ta?.rateUnit ?? 'Rentabilidade anual'}
              variant="up"
              help={ta?.rateDescription ?? undefined}
            />
            <MetricCard
              label="Retorno 12m"
              value={fmtPct(return1y)}
              sub="Marcação a mercado"
              variant={pctVariant(return1y)}
              help="Valorização do preço de venda antecipada nos últimos 12 meses — não é a rentabilidade contratada."
            />
            <MetricCard
              label="Vencimento"
              value={ta?.maturityDate ? fmtDateOnly(ta.maturityDate) : '—'}
              sub={ta?.yearsToMaturity != null ? `em ${fmt(ta.yearsToMaturity, 1)} anos` : 'Data de resgate'}
            />
            <MetricCard
              label="Volatilidade"
              value={ta?.priceVolatility1y != null ? `${fmt(ta.priceVolatility1y, 1)}%` : '—'}
              sub="Anualizada (1 ano)"
              help="Desvio padrão anualizado das variações diárias do preço de mercado. Só importa para quem pode vender antes do vencimento."
            />
            <MetricCard
              label="Ranking"
              value={ta?.rateRankInIndexer != null ? `#${ta.rateRankInIndexer}` : '—'}
              sub={ta?.totalInIndexer != null ? `de ${ta.totalInIndexer} ${indexerName ?? ''}` : 'Por taxa de compra'}
              help="Posição da taxa de compra entre os títulos com o mesmo indexador (maior taxa primeiro)."
            />
          </>
        )}
      </div>

      {/* Rate semantics note (e.g. Selic bonds quote a spread, not the full yield) */}
      {ta?.rateDescription && (
        <div className="ta-section-card">
          <div className="ta-sector-note" style={{ marginTop: 0 }}>{ta.rateDescription}</div>
        </div>
      )}

      {/* Historical rate/price chart */}
      <TreasuryHistorySection symbol={analysis.symbol} />

      {/* 52-week rate range */}
      {ta && <TreasuryRateRange ta={ta} />}

      {/* Rate changes per period */}
      {ta && <TreasuryRateChangesSection ta={ta} />}

      {/* Mark-to-market returns per period */}
      {ta && <TreasuryReturnsSection ta={ta} />}

      <div className="ta-info-grid">
        {/* Bond data */}
        <div className="ta-section-card">
          <div className="ta-section-title">Dados do Título</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Tipo</span><strong>{ta?.bondType ?? '—'}</strong></div>
            <div className="ta-info-row"><span>Indexador</span><strong>{indexerName ?? '—'}</strong></div>
            <div className="ta-info-row"><span>Cupom</span>
              <strong>{ta?.couponType ? (TREASURY_COUPON_LABEL[ta.couponType.toLowerCase()] ?? ta.couponType) : '—'}</strong>
            </div>
            {incomeStartYear != null && (
              <div className="ta-info-row">
                <span>{(ta?.bondType ?? '').toLowerCase().includes('renda+') ? 'Renda mensal' : 'Pagamentos mensais'}</span>
                <strong>de {incomeStartYear} até {maturityYear}</strong>
              </div>
            )}
            <div className="ta-info-row"><span>Vencimento{incomeStartYear != null ? ' (última parcela)' : ''}</span><strong>{fmtDateOnly(ta?.maturityDate)}</strong></div>
            {ta?.daysToMaturity != null && (
              <div className="ta-info-row"><span>Dias até o vencimento</span>
                <strong>{ta.daysToMaturity} ({fmt(ta.yearsToMaturity, 1)} anos)</strong></div>
            )}
            <div className="ta-info-row"><span>Duration</span><strong>{fmtDuration(ta?.durationDays)}</strong></div>
            {ta?.baseDate && (
              <div className="ta-info-row"><span>Data-base da cotação</span><strong>{fmtDateOnly(ta.baseDate)}</strong></div>
            )}
          </div>
        </div>

        {/* Prices and rates */}
        <div className="ta-section-card">
          <div className="ta-section-title">Preços e Taxas</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Taxa de compra</span>
              <strong className="up">{treasuryRateLabel(ta?.indexer, ta?.buyRate)}</strong></div>
            <div className="ta-info-row"><span>Taxa de venda</span>
              <strong>{treasuryRateLabel(ta?.indexer, ta?.sellRate)}</strong></div>
            {ta?.rateSpread != null && (
              <div className="ta-info-row"><span>Spread compra/venda</span><strong>{fmtPP(ta.rateSpread)}</strong></div>
            )}
            <div className="ta-info-row"><span>Preço de compra</span>
              <strong>{ta?.buyPrice != null ? fmtBRL(ta.buyPrice) : '—'}</strong></div>
            <div className="ta-info-row"><span>Preço de venda</span>
              <strong>{ta?.sellPrice != null ? fmtBRL(ta.sellPrice) : '—'}</strong></div>
            <div className="ta-info-row"><span>Preço base</span>
              <strong>{ta?.basePrice != null ? fmtBRL(ta.basePrice) : '—'}</strong></div>
          </div>
        </div>

        {/* Risk */}
        {ta && <TreasuryRiskSection ta={ta} />}

        {/* Rate extremes */}
        {ta && <TreasuryExtremesSection ta={ta} />}
      </div>

      {/* Same-indexer bonds */}
      {ta && <TreasurySimilarBondsSection ta={ta} />}
    </>
  )
}

// ── Fund Components ──────────────────────────────────────────────────────────

const FUND_TYPE_LABELS: Record<string, string> = {
  fiagro: 'FIAGRO', fidc: 'FIDC', fip: 'FIP', 'fi-infra': 'FI-Infra', fiinfra: 'FI-Infra',
  'fi-agro': 'FIAGRO', fund: 'Fundo',
}

const FUND_PERIODS = TREASURY_PERIODS

const FIAGRO_ALLOC_LABELS: Record<string, string> = {
  cra: 'CRA', cpr: 'CPR', cdca: 'CDCA', lca: 'LCA', lci: 'LCI',
  fii: 'FIIs', fip: 'FIPs', fidc: 'FIDCs', fiagro: 'FIAGROs',
  ruralRealEstate: 'Imóveis rurais',
}

const FIDC_SECTOR_LABELS: Record<string, string> = {
  finance: 'Financeiro', commerce: 'Comércio', industry: 'Indústria', services: 'Serviços',
  factoring: 'Factoring', realEstate: 'Imobiliário', agribusiness: 'Agronegócio',
  creditRights: 'Direitos creditórios', publicSector: 'Setor público', judicial: 'Judicial',
  brand: 'Marca', other: 'Outros',
}

const PORTFOLIO_SUMMARY_LABELS: Record<string, string> = {
  publicBondsValue: 'Títulos públicos', fundHoldingsValue: 'Cotas de fundos',
  creditAssetsValue: 'Ativos de crédito', listedSecuritiesValue: 'Títulos listados',
  receivablesValue: 'Valores a receber',
}

const INVESTOR_BREAKDOWN_LABELS: Record<string, string> = {
  individualRetailPercent: 'Pessoas físicas', legalEntitiesPercent: 'Pessoas jurídicas',
  fundsOrClubsPercent: 'Fundos e clubes', nonResidentsPercent: 'Não residentes',
  otherPercent: 'Outros',
}

// Safe readers for the raw brapi documents (shape varies per fund type)
function docObj(doc: FundRawDocument | null | undefined, key: string): FundRawDocument | null {
  const v = doc?.[key]
  return v != null && typeof v === 'object' && !Array.isArray(v) ? v as FundRawDocument : null
}
function docNum(obj: FundRawDocument | null | undefined, key: string): number | null {
  const v = obj?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function docStr(obj: FundRawDocument | null | undefined, key: string): string | null {
  const v = obj?.[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}
/** Dates inside raw documents come as full ISO timestamps — keep only the date part. */
function docDate(obj: FundRawDocument | null | undefined, key: string): string | null {
  const v = docStr(obj, key)
  return v ? v.slice(0, 10) : null
}

/** Horizontal proportional bars for a value breakdown (composition charts). */
function AllocationBars({ items, formatValue }: {
  items: { label: string; value: number }[]
  formatValue: (v: number) => string
}) {
  const positive = items.filter(i => i.value > 0).sort((a, b) => b.value - a.value)
  if (positive.length === 0) return null
  const max = positive[0].value
  return (
    <div>
      {positive.map(i => (
        <div key={i.label} className="ta-fund-alloc-row">
          <span className="ta-fund-alloc-label" title={i.label}>{i.label}</span>
          <div className="ta-fund-alloc-track">
            <div className="ta-fund-alloc-fill" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <span className="ta-fund-alloc-value">{formatValue(i.value)}</span>
        </div>
      ))}
    </div>
  )
}

function Fund52WeekRange({ fa }: { fa: FundAnalysisData }) {
  if (fa.price52wLow == null || fa.price52wHigh == null || fa.price == null) return null
  const pct = fa.pricePositionInRange52w
    ?? (fa.price52wHigh > fa.price52wLow
      ? Math.min(100, Math.max(0, ((fa.price - fa.price52wLow) / (fa.price52wHigh - fa.price52wLow)) * 100))
      : 50)

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Faixa de 52 Semanas</div>
      <div className="ta-52w">
        <span className="ta-52w-bound">{fmtBRL(fa.price52wLow)}</span>
        <div className="ta-52w-track">
          <div className="ta-52w-fill" style={{ width: `${pct}%` }} />
          <div className="ta-52w-marker" style={{ left: `${pct}%` }}>
            <span className="ta-52w-price">{fmtBRL(fa.price)}</span>
          </div>
        </div>
        <span className="ta-52w-bound">{fmtBRL(fa.price52wHigh)}</span>
      </div>
    </div>
  )
}

function FundReturnsSection({ fa }: { fa: FundAnalysisData }) {
  const returns = fa.priceReturns
  if (!returns || Object.keys(returns).length === 0) return null
  const periods = FUND_PERIODS.filter(p => returns[p.key] != null)
  if (periods.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Retornos (preço de mercado)</div>
      <div className="ta-crypto-returns-grid ta-returns-grid--inset">
        {periods.map(p => (
          <MetricCard key={p.key} label={p.label} value={fmtPct(returns[p.key])}
            variant={pctVariant(returns[p.key])} />
        ))}
      </div>
      <div className="ta-sector-note">
        Valorização da cota negociada na B3 no período — não inclui os rendimentos distribuídos.
      </div>
    </div>
  )
}

function FundNavReturnsSection({ fa }: { fa: FundAnalysisData }) {
  const returns = fa.navReturns
  if (!returns || Object.keys(returns).length === 0) return null
  const periods = FUND_PERIODS.filter(p => returns[p.key] != null)
  if (periods.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Evolução do Valor Patrimonial da Cota</div>
      <div className="ta-crypto-returns-grid ta-returns-grid--inset">
        {periods.map(p => (
          <MetricCard key={p.key} label={p.label} value={fmtPct(returns[p.key])}
            variant={pctVariant(returns[p.key])} />
        ))}
      </div>
      <div className="ta-sector-note">
        Variação do VP/cota informado à CVM — mostra a geração de valor da carteira, sem o humor do mercado.
      </div>
    </div>
  )
}

function FundRiskSection({ fa }: { fa: FundAnalysisData }) {
  const hasData = fa.priceVolatility1y != null || fa.priceMaxDrawdown1y != null
    || fa.navVolatility1y != null || fa.pricePositionInRange52w != null
  if (!hasData) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Risco e Volatilidade</div>
      <div className="ta-info-rows">
        {fa.priceVolatility1y != null && (
          <div className="ta-info-row"><span>Volatilidade do preço 1 ano (anualizada)</span>
            <strong>{fmt(fa.priceVolatility1y)}%</strong></div>
        )}
        {fa.priceMaxDrawdown1y != null && (
          <div className="ta-info-row"><span>Queda máxima do preço em 1 ano (drawdown)</span>
            <strong className="down">{fmt(fa.priceMaxDrawdown1y)}%</strong></div>
        )}
        {fa.navVolatility1y != null && (
          <div className="ta-info-row"><span>Volatilidade do VP/cota 1 ano</span>
            <strong>{fmt(fa.navVolatility1y)}%</strong></div>
        )}
        {fa.maxDrawdown1y != null && (
          <div className="ta-info-row"><span>Queda máxima do VP/cota em 1 ano</span>
            <strong className="down">{fmt(fa.maxDrawdown1y)}%</strong></div>
        )}
        {fa.pricePositionInRange52w != null && (
          <div className="ta-info-row"><span>Posição do preço na faixa de 52 semanas</span>
            <strong>{fmt(fa.pricePositionInRange52w, 0)}%</strong></div>
        )}
      </div>
    </div>
  )
}

function FundEquitySection({ fa }: { fa: FundAnalysisData }) {
  const hasData = fa.equity != null || fa.navPerShare != null || fa.totalInvestors != null
  if (!hasData) return null
  const equity1y = fa.equityChanges?.['1y']
  const investors1y = fa.investorsChanges?.['1y']

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Patrimônio e Cotistas</div>
      <div className="ta-info-rows">
        {fa.equity != null && (
          <div className="ta-info-row"><span>Patrimônio líquido</span><strong>{fmtCap(fa.equity)}</strong></div>
        )}
        {fa.totalAssets != null && (
          <div className="ta-info-row"><span>Ativos totais</span><strong>{fmtCap(fa.totalAssets)}</strong></div>
        )}
        {fa.navPerShare != null && (
          <div className="ta-info-row"><span>VP por cota</span><strong>{fmtBRL(fa.navPerShare)}</strong></div>
        )}
        {fa.sharesOutstanding != null && (
          <div className="ta-info-row"><span>Cotas emitidas</span><strong>{fmtShares(fa.sharesOutstanding)}</strong></div>
        )}
        {fa.totalInvestors != null && (
          <div className="ta-info-row"><span>Total de cotistas</span><strong>{fmtInvestors(fa.totalInvestors)}</strong></div>
        )}
        {equity1y != null && (
          <div className="ta-info-row"><span>Variação do patrimônio em 1 ano</span>
            <strong className={equity1y >= 0 ? 'up' : 'down'}>{fmtPct(equity1y)}</strong></div>
        )}
        {investors1y != null && (
          <div className="ta-info-row"><span>Variação de cotistas em 1 ano</span>
            <strong className={investors1y >= 0 ? 'up' : 'down'}>{fmtPct(investors1y)}</strong></div>
        )}
        {fa.navHistoryHigh != null && (
          <div className="ta-info-row"><span>Maior VP/cota registrado</span>
            <strong className="up">{fmtBRL(fa.navHistoryHigh)}{fa.navHistoryHighDate ? ` (${fmtDateOnly(fa.navHistoryHighDate)})` : ''}</strong></div>
        )}
        {fa.navHistoryLow != null && (
          <div className="ta-info-row"><span>Menor VP/cota registrado</span>
            <strong className="down">{fmtBRL(fa.navHistoryLow)}{fa.navHistoryLowDate ? ` (${fmtDateOnly(fa.navHistoryLowDate)})` : ''}</strong></div>
        )}
      </div>
    </div>
  )
}

/** Portfolio composition — the source document depends on the fund type. */
function FundPortfolioSection({ fa }: { fa: FundAnalysisData }) {
  const docs = fa.documents ?? {}

  // FIAGRO: allocation by instrument class (CRA, CPR, FIDCs...)
  const fiagro = docObj(docs['fiagro_portfolio'], 'allocations')
  if (fiagro) {
    const items = Object.entries(FIAGRO_ALLOC_LABELS)
      .map(([key, label]) => ({ label, value: docNum(fiagro, key) ?? 0 }))
    const refDate = docDate(docs['fiagro_portfolio'], 'referenceDate')
    return (
      <div className="ta-section-card">
        <div className="ta-section-header">
          <div className="ta-section-title">Composição da Carteira</div>
          {refDate && <span className="ta-sector-badge">ref. {fmtDateOnly(refDate)}</span>}
        </div>
        <AllocationBars items={items} formatValue={v => fmtCap(v)} />
      </div>
    )
  }

  // FIDC: receivables by sector + risk buckets
  const fidcDoc = docs['fidc_portfolio']
  const sectors = docObj(fidcDoc, 'sectors')
  if (sectors) {
    const items = Object.entries(FIDC_SECTOR_LABELS)
      .map(([key, label]) => ({ label, value: docNum(sectors, key) ?? 0 }))
    const cedentes = docObj(fidcDoc, 'cedentes')
    const top1 = docNum(cedentes, 'top1Percent')
    const refDate = docDate(fidcDoc, 'referenceDate')
    return (
      <div className="ta-section-card">
        <div className="ta-section-header">
          <div className="ta-section-title">Carteira de Recebíveis por Setor</div>
          {refDate && <span className="ta-sector-badge">ref. {fmtDateOnly(refDate)}</span>}
        </div>
        <AllocationBars items={items} formatValue={v => fmtCap(v)} />
        {top1 != null && top1 > 0 && (
          <div className="ta-sector-note">
            Maior cedente concentra {fmt(top1)}% da carteira
            {docNum(cedentes, 'top2Percent') != null ? `; o segundo, ${fmt(docNum(cedentes, 'top2Percent')!)}%` : ''}.
          </div>
        )}
      </div>
    )
  }

  // Generic portfolio (FI-Infra etc.): summary buckets
  const summary = docObj(docs['portfolio'], 'summary')
  if (summary) {
    const items = Object.entries(PORTFOLIO_SUMMARY_LABELS)
      .map(([key, label]) => ({ label, value: docNum(summary, key) ?? 0 }))
    const holdings = docNum(summary, 'holdingsCount')
    const refDate = docDate(docs['portfolio'], 'referenceDate')
    return (
      <div className="ta-section-card">
        <div className="ta-section-header">
          <div className="ta-section-title">Composição da Carteira</div>
          {refDate && <span className="ta-sector-badge">ref. {fmtDateOnly(refDate)}</span>}
        </div>
        <AllocationBars items={items} formatValue={v => fmtCap(v)} />
        {holdings != null && (
          <div className="ta-sector-note">{holdings} posições na carteira informada à CVM.</div>
        )}
      </div>
    )
  }

  // FIP: committed capital and quota data from the periodic report
  const fip = docs['fip_report']
  const capital = docObj(fip, 'capital')
  if (capital) {
    const quotaClass = docObj(fip, 'quotaClass')
    return (
      <div className="ta-section-card">
        <div className="ta-section-title">Capital e Cotas (informe periódico)</div>
        <div className="ta-info-rows">
          {docNum(capital, 'committed') != null && (
            <div className="ta-info-row"><span>Capital comprometido</span><strong>{fmtCap(docNum(capital, 'committed'))}</strong></div>
          )}
          {docNum(capital, 'subscribed') != null && (
            <div className="ta-info-row"><span>Capital subscrito</span><strong>{fmtCap(docNum(capital, 'subscribed'))}</strong></div>
          )}
          {docNum(capital, 'paidIn') != null && (
            <div className="ta-info-row"><span>Capital integralizado</span><strong>{fmtCap(docNum(capital, 'paidIn'))}</strong></div>
          )}
          {docNum(fip, 'netEquity') != null && (
            <div className="ta-info-row"><span>Patrimônio líquido do informe</span><strong>{fmtCap(docNum(fip, 'netEquity'))}</strong></div>
          )}
          {docStr(fip, 'targetAudience') && (
            <div className="ta-info-row"><span>Público-alvo</span><strong>{docStr(fip, 'targetAudience')}</strong></div>
          )}
          {docNum(quotaClass, 'quotaValue') != null && (
            <div className="ta-info-row"><span>Valor da cota (classe {docStr(quotaClass, 'name') ?? '—'})</span>
              <strong>{fmtBRL(docNum(quotaClass, 'quotaValue'))}</strong></div>
          )}
        </div>
      </div>
    )
  }

  return null
}

/** Investor breakdown from the CVM profile document (percentages). */
function FundInvestorsSection({ fa }: { fa: FundAnalysisData }) {
  const breakdown = docObj(fa.documents?.['profile'], 'investorBreakdown')
  if (!breakdown) return null
  const items = Object.entries(INVESTOR_BREAKDOWN_LABELS)
    .map(([key, label]) => ({ label, value: docNum(breakdown, key) ?? 0 }))
  if (items.every(i => i.value <= 0)) return null
  const refDate = docDate(fa.documents?.['profile'], 'referenceDate')

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Perfil dos Cotistas</div>
        {refDate && <span className="ta-sector-badge">ref. {fmtDateOnly(refDate)}</span>}
      </div>
      <AllocationBars items={items} formatValue={v => `${fmt(v, 1)}%`} />
    </div>
  )
}

function FundDividendsSection({ fa }: { fa: FundAnalysisData }) {
  const dividends = fa.recentDividends
  if (!dividends || dividends.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Últimos Rendimentos</div>
        {fa.dividendsSum12m != null && (
          <span className="ta-sector-badge">{fmtBRL(fa.dividendsSum12m)}/cota em 12m</span>
        )}
      </div>
      <div className="ta-sector-table-wrap">
        <table className="ta-sector-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Data com</th>
              <th>Pagamento</th>
              <th className="right">Valor por cota</th>
            </tr>
          </thead>
          <tbody>
            {dividends.map((d, i) => (
              <tr key={`${d.paymentDate}-${i}`}>
                <td>{d.label ?? 'RENDIMENTO'}</td>
                <td>{fmtDateOnly(d.lastDatePrior)}</td>
                <td>{fmtDateOnly(d.paymentDate)}</td>
                <td className="right">{d.rate != null ? fmtBRL(d.rate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** All funds of the same type ordered by DY 12m, current one highlighted. */
function FundSimilarSection({ fa }: { fa: FundAnalysisData }) {
  const navigate = useNavigate()
  if (!fa.similarFunds || fa.similarFunds.length === 0) return null

  const rows = [
    {
      symbol: fa.symbol, name: fa.name, fundType: fa.fundType, price: fa.price,
      priceToNav: fa.priceToNav, dividendYield12m: fa.dividendYield12m,
      dividendYieldMonthly: fa.dividendYieldMonthly, equity: fa.equity,
      totalInvestors: fa.totalInvestors, isCurrent: true,
    },
    ...fa.similarFunds.map(f => ({ ...f, isCurrent: false })),
  ].sort((a, b) => (b.dividendYield12m ?? -1) - (a.dividendYield12m ?? -1))

  const typeLabel = fa.fundType ? (FUND_TYPE_LABELS[fa.fundType.toLowerCase()] ?? fa.fundType) : ''

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Comparação de Fundos do Mesmo Tipo</div>
        <span className="ta-sector-badge">{typeLabel} · {rows.length} fundos</span>
      </div>
      <div className="ta-sector-table-wrap">
        <table className="ta-sector-table">
          <thead>
            <tr>
              <th>Fundo</th>
              <th className="right">Preço</th>
              <th className="right">P/VP</th>
              <th className="right">DY 12m</th>
              <th className="right">Patrimônio</th>
              <th className="right">Cotistas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(f => (
              <tr key={f.symbol}
                style={f.isCurrent ? undefined : { cursor: 'pointer' }}
                onClick={f.isCurrent ? undefined : () => navigate(`/ticker/${f.symbol}`)}>
                <td className={f.isCurrent ? 'ta-sector-company' : undefined}>
                  {f.symbol}{f.isCurrent ? ' (este)' : ''}
                </td>
                <td className="right">{f.price != null ? fmtBRL(f.price) : '—'}</td>
                <td className="right">{fmt(f.priceToNav)}</td>
                <td className="right">{f.dividendYield12m != null ? `${fmt(f.dividendYield12m)}%` : '—'}</td>
                <td className="right">{f.equity != null ? fmtCap(f.equity) : '—'}</td>
                <td className="right">{fmtInvestors(f.totalInvestors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ta-sector-note">
        Ordenado pelo dividend yield dos últimos 12 meses. Clique em um fundo para abrir a análise dele.
      </div>
    </div>
  )
}

function FundAnalysisPage({ analysis }: { analysis: TickerAnalysis }) {
  const { data: fa, loading } = useFundAnalysis(analysis.symbol)
  const up = (analysis.changePercent ?? 0) >= 0

  const pvp = fa?.priceToNav
  const pvpVariant = pvp == null ? undefined : pvp < 1 ? 'up' : pvp > 1.2 ? 'down' : 'neutral'
  const fundTypeLabel = fa?.fundType
    ? (FUND_TYPE_LABELS[fa.fundType.toLowerCase()] ?? fa.fundType.toUpperCase())
    : '—'
  const return1y = fa?.priceReturns?.['1y']

  return (
    <>
      {/* Fund Metrics Bar */}
      <div className="ta-metrics-bar ta-metrics-bar--fund">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="ta-metric ta-metric--skeleton" />)
        ) : (
          <>
            <MetricCard label="P/VP" value={fmt(pvp)} sub="Preço / Valor Patrimonial" variant={pvpVariant}
              help="Preço da cota na B3 dividido pelo valor patrimonial. Abaixo de 1, o fundo negocia com desconto sobre o patrimônio." />
            <MetricCard
              label="DY 12m"
              value={fa?.dividendYield12m != null ? `${fmt(fa.dividendYield12m)}%` : '—'}
              sub={fa?.dividendCount12m != null ? `${fa.dividendCount12m} pagamentos` : 'Dividend Yield anual'}
              variant={fa?.dividendYield12m != null && fa.dividendYield12m > 8 ? 'up' : undefined}
              help="Rendimentos distribuídos nos últimos 12 meses divididos pelo preço atual da cota."
            />
            <MetricCard
              label="Retorno 12m"
              value={fmtPct(return1y)}
              sub="Preço de mercado"
              variant={pctVariant(return1y)}
              help="Valorização da cota na B3 nos últimos 12 meses, sem contar os rendimentos."
            />
            <MetricCard
              label="Volatilidade"
              value={fa?.priceVolatility1y != null ? `${fmt(fa.priceVolatility1y, 1)}%` : '—'}
              sub="Anualizada (1 ano)"
              help="Desvio padrão anualizado das variações diárias do preço. Quanto maior, mais a cota oscila."
            />
            <MetricCard
              label="Ranking DY"
              value={fa?.dyRankInType != null ? `#${fa.dyRankInType}` : '—'}
              sub={fa?.totalInType != null ? `de ${fa.totalInType} ${fundTypeLabel}` : 'Por DY 12m'}
              help="Posição do dividend yield 12m entre os fundos do mesmo tipo."
            />
          </>
        )}
      </div>

      {/* Price Chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* 52-week range */}
      {fa && <Fund52WeekRange fa={fa} />}

      {/* Market price returns */}
      {fa && <FundReturnsSection fa={fa} />}

      {/* NAV returns */}
      {fa && <FundNavReturnsSection fa={fa} />}

      <div className="ta-info-grid">
        {/* Risk */}
        {fa && <FundRiskSection fa={fa} />}

        {/* Equity and investors */}
        {fa && <FundEquitySection fa={fa} />}

        {/* Market data */}
        <div className="ta-section-card">
          <div className="ta-section-title">Dados de Mercado</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Preço atual</span><strong>{fmtBRL(fa?.price ?? analysis.lastPrice)}</strong></div>
            <div className="ta-info-row"><span>Variação hoje</span>
              <strong className={up ? 'up' : 'down'}>{fmtPct(analysis.changePercent)}</strong>
            </div>
            <div className="ta-info-row"><span>Volume</span><strong>{fmtCap(analysis.volume)}</strong></div>
            {fa?.priceToNav != null && (
              <div className="ta-info-row"><span>P/VP</span>
                <strong className={pvpVariant === 'up' ? 'up' : pvpVariant === 'down' ? 'down' : ''}>{fmt(pvp)}</strong>
              </div>
            )}
            {fa?.dividendYield1m != null && (
              <div className="ta-info-row"><span>DY 1 mês</span><strong>{fmt(fa.dividendYield1m)}%</strong></div>
            )}
            {fa?.monthlyReturn != null && (
              <div className="ta-info-row"><span>Retorno no mês (informe)</span>
                <strong className={fa.monthlyReturn >= 0 ? 'up' : 'down'}>{fmtPct(fa.monthlyReturn)}</strong></div>
            )}
            {fa?.asOfDate && (
              <div className="ta-info-row"><span>Data-base do informe</span><strong>{fmtDateOnly(fa.asOfDate)}</strong></div>
            )}
          </div>
        </div>

        {/* About the fund */}
        <div className="ta-section-card">
          <div className="ta-section-title">Sobre o Fundo</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>Tipo de fundo</span><strong>{fundTypeLabel}</strong></div>
            {fa?.b3Classification && (
              <div className="ta-info-row"><span>Classificação B3</span><strong>{fa.b3Classification}</strong></div>
            )}
            {fa?.cnpj && (
              <div className="ta-info-row"><span>CNPJ</span><strong>{fa.cnpj}</strong></div>
            )}
            {fa?.isin && (
              <div className="ta-info-row"><span>ISIN</span><strong>{fa.isin}</strong></div>
            )}
            {fa?.legalName && (
              <div className="ta-info-row"><span>Razão social</span><strong>{fa.legalName}</strong></div>
            )}
            {fa?.managerName && (
              <div className="ta-info-row"><span>Gestor</span><strong>{fa.managerName}</strong></div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio composition (per fund type) */}
      {fa && <FundPortfolioSection fa={fa} />}

      {/* Investor profile */}
      {fa && <FundInvestorsSection fa={fa} />}

      {/* Recent dividend events */}
      {fa && <FundDividendsSection fa={fa} />}

      {/* Administrator */}
      {fa?.adminName && (
        <div className="ta-fii-admin-card">
          <div className="ta-fii-admin-icon">🏦</div>
          <div>
            <div className="ta-fii-admin-label">Administrador</div>
            <div className="ta-fii-admin-name">{fa.adminName}</div>
            {fa.cnpj && (
              <div className="ta-fii-admin-cnpj">CNPJ do fundo: {fa.cnpj}</div>
            )}
          </div>
        </div>
      )}

      {/* Same-type funds */}
      {fa && <FundSimilarSection fa={fa} />}

      {!fa && !loading && (
        <div className="ta-section-card">
          <div className="ta-section-title">Análise avançada</div>
          <div className="ta-info-rows">
            <div className="ta-info-row">
              <span>Sem dados de análise para este fundo ainda — aguarde o próximo sync.</span>
            </div>
          </div>
        </div>
      )}
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
            {isTreasury ? (
              <span className="ta-logo--treasury" role="img" aria-label="Tesouro Direto">🏛️</span>
            ) : (
              <img
                className="ta-logo"
                src={analysis.logoUrl ?? ''}
                alt={analysis.symbol}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
          <div>
            <div className="ta-hero-top">
              <h1 className="ta-symbol">{isTreasury ? (analysis.name ?? analysis.symbol) : analysis.symbol}</h1>
              {assetLabel && <span className="ta-type-badge">{assetLabel}</span>}
            </div>
            <div className="ta-long-name">{isTreasury ? 'Tesouro Direto' : (analysis.longName ?? analysis.name)}</div>
            {analysis.sector && <div className="ta-sector">{analysis.sector}</div>}
          </div>
        </div>
        <div className="ta-hero-right">
          <div className="ta-price">{fmtBRL(analysis.lastPrice)}</div>
          {(!isTreasury || analysis.changePercent != null) && (
            <div className={`ta-day-change ${up ? 'ta-day-change--up' : 'ta-day-change--down'}`}>
              {up ? '▲' : '▼'} {fmtPct(analysis.changePercent)} <span className="ta-day-label">hoje</span>
            </div>
          )}
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
