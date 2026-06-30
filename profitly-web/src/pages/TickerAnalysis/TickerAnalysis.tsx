import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { Header } from '../../components/Header/Header'
import { useTickerAnalysis, usePriceHistory } from '../../hooks/useTickerAnalysis'
import { useI18n } from '../../i18n/I18nContext'
import type { TickerAnalysis } from '../../types/TickerAnalysis'
import './TickerAnalysis.css'

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
  return `R$ ${fmt(v / 1e6, 0)}M`
}

function fmtShares(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e9) return `${fmt(v / 1e9, 2)}B`
  if (v >= 1e6) return `${fmt(v / 1e6, 1)}M`
  return String(v)
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR')
  } catch {
    return d
  }
}

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
                tickFormatter={d => {
                  try { return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
                  catch { return '' }
                }}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={v => `R$${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                labelFormatter={d => {
                  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
                }}
                formatter={(value: unknown) => [`R$ ${Number(value).toFixed(2)}`, 'Fechamento']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#${fillId})`}
                dot={false}
                activeDot={{ r: 4, fill: strokeColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function DividendSection({ analysis }: { analysis: TickerAnalysis }) {
  const dividends = (analysis.dividends ?? [])
    .filter(d => d.rate != null && d.rate > 0)
    .slice(0, 24)

  if (dividends.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Histórico de Dividendos</div>
      <div className="ta-dividends-chart">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dividends} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barSize={14}>
            <XAxis
              dataKey="lastDatePrior"
              tickFormatter={d => d ? new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : ''}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
              formatter={(v: unknown) => [`R$ ${Number(v).toFixed(4)}`, 'Valor']}
              labelFormatter={d => d ? new Date(d).toLocaleDateString('pt-BR') : ''}
            />
            <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
              {dividends.map((_, i) => (
                <Cell key={i} fill="var(--accent)" opacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ta-dividends-table">
        <table>
          <thead>
            <tr>
              <th>Data com</th>
              <th>Pagamento</th>
              <th>Tipo</th>
              <th className="right">Valor (R$)</th>
              <th>Ref.</th>
            </tr>
          </thead>
          <tbody>
            {dividends.map((d, i) => (
              <tr key={i}>
                <td>{fmtDate(d.lastDatePrior)}</td>
                <td>{fmtDate(d.paymentDate)}</td>
                <td><span className="ta-div-badge">{d.label ?? '—'}</span></td>
                <td className="right ta-div-value">{d.rate != null ? d.rate.toFixed(4) : '—'}</td>
                <td className="muted">{d.relatedTo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TickerAnalysis() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { analysis, loading, error } = useTickerAnalysis(symbol ?? '')

  if (loading) {
    return (
      <div className="ta-page">
        <Header />
        <div className="ta-state">Carregando análise...</div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="ta-page">
        <Header />
        <div className="ta-state ta-state--error">{error ?? 'Ticker não encontrado'}</div>
      </div>
    )
  }

  const up = (analysis.changePercent ?? 0) >= 0
  const assetLabel = (t.assetType as Record<string, string>)[
    (analysis.subType ?? analysis.assetType ?? '').toLowerCase()
  ] ?? (analysis.subType ?? analysis.assetType ?? '')

  return (
    <div className="ta-page">
      <Header />

      {/* Breadcrumb */}
      <nav className="ta-breadcrumb">
        <button className="ta-breadcrumb-btn" onClick={() => navigate('/')}>{t.nav.tickers}</button>
        <span className="ta-sep">›</span>
        {assetLabel && <><span className="ta-breadcrumb-part">{assetLabel}</span><span className="ta-sep">›</span></>}
        <span className="ta-breadcrumb-active">{analysis.symbol}</span>
      </nav>

      {/* Hero */}
      <div className="ta-hero">
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
            <div className="ta-52w">
              52 semanas: {fmtPct(analysis.weekChange52 * 100)}
            </div>
          )}
        </div>
      </div>

      {/* Key metrics bar */}
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

      {/* Price chart */}
      <PriceChartSection symbol={analysis.symbol} />

      {/* Info grid */}
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
            <div className="ta-info-row"><span>Enterprise Value</span><strong>{fmtCap(analysis.enterpriseValue)}</strong></div>
          </div>
        </div>

        <div className="ta-section-card">
          <div className="ta-section-title">Indicadores Fundamentalistas</div>
          <div className="ta-info-rows">
            <div className="ta-info-row"><span>P/L (Trailing)</span><strong>{fmt(analysis.trailingPE)}</strong></div>
            <div className="ta-info-row"><span>P/L (Forward)</span><strong>{fmt(analysis.forwardPE)}</strong></div>
            <div className="ta-info-row"><span>P/VP</span><strong>{fmt(analysis.priceToBook)}</strong></div>
            <div className="ta-info-row"><span>PEG Ratio</span><strong>{fmt(analysis.pegRatio)}</strong></div>
            <div className="ta-info-row"><span>Dividend Yield</span><strong className="up">{fmtDY(analysis.dividendYield)}</strong></div>
            <div className="ta-info-row"><span>Último dividendo</span><strong>{fmtBRL(analysis.lastDividendValue)}</strong></div>
            <div className="ta-info-row"><span>Data dividendo</span><strong>{fmtDate(analysis.lastDividendDate)}</strong></div>
            <div className="ta-info-row"><span>Beta</span><strong>{fmt(analysis.beta)}</strong></div>
            <div className="ta-info-row"><span>LPA</span><strong>{fmtBRL(analysis.earningsPerShare)}</strong></div>
            <div className="ta-info-row"><span>Margem líquida</span><strong>{fmtDY(analysis.profitMargins)}</strong></div>
          </div>
        </div>
      </div>

      {/* Dividends */}
      <DividendSection analysis={analysis} />
    </div>
  )
}
