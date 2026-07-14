import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { useTickers } from '../../hooks/useTickers'
import { useI18n } from '../../i18n/I18nContext'
import { api } from '../../lib/api'
import type { Ticker } from '../../types/Ticker'
import { TickerTape } from '../../components/TickerTape/TickerTape'
import { TickerLogo } from '../../components/TickerLogo/TickerLogo'
import { NewsSection } from './NewsSection'
import './Dashboard.css'

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

// ── Rankings ──────────────────────────────────────────────────────────────────

interface RankingItem { symbol: string; name: string; logoUrl: string | null; value: number }
interface Rankings { dividendYield: RankingItem[]; marketCap: RankingItem[]; revenue: RankingItem[] }

const ASSET_TYPE_TABS = [
  { label: 'Ações', value: 'stock' },
  { label: 'FIIs', value: 'FII' },
  { label: 'Criptomoedas', value: 'crypto' },
]

function fmtCompact(v: number): string {
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)} T`
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)} B`
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)} M`
  return `R$ ${v.toFixed(0)}`
}

function RankingsSection() {
  const navigate = useNavigate()
  const [assetType, setAssetType] = useState('stock')
  const [rankings, setRankings] = useState<Rankings | null>(null)

  useEffect(() => {
    api.get<Rankings>(`/api/rankings?assetType=${assetType}`)
      .then(r => setRankings(r.data))
      .catch(() => setRankings(null))
  }, [assetType])

  const isFii = assetType === 'FII'

  const cols: { title: string; icon: string; items: RankingItem[]; fmt: (v: number) => string }[] = [
    {
      title: 'Maiores Dividend Yield',
      icon: '◎',
      items: rankings?.dividendYield ?? [],
      // FII DY already comes as % (e.g. 12.5 = 12.5%). Stocks come as decimal (0.12 = 12%).
      fmt: isFii ? v => `${v.toFixed(2)}%` : v => `${(v * 100).toFixed(2)}%`,
    },
    {
      title: isFii ? 'Maiores Patrimônios' : 'Maiores Valor de Mercado',
      icon: '▦',
      items: rankings?.marketCap ?? [],
      fmt: fmtCompact,
    },
    {
      title: isFii ? 'Mais Cotistas' : 'Maiores Receitas',
      icon: isFii ? '👥' : '↗',
      items: rankings?.revenue ?? [],
      fmt: isFii ? v => `${(v / 1000).toFixed(0)}k` : fmtCompact,
    },
  ]

  return (
    <section className="rankings-section">
      <div className="rankings-header">
        <h2 className="rankings-title">🏅 Rankings de Ativos</h2>
        <div className="rankings-tabs">
          {ASSET_TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              className={`rankings-tab ${assetType === tab.value ? 'rankings-tab--active' : ''}`}
              onClick={() => setAssetType(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rankings-grid">
        {cols.map(col => (
          <div key={col.title} className="rankings-card">
            <div className="rankings-card-header">
              <span className="rankings-card-icon">{col.icon}</span>
              <span className="rankings-card-title">{col.title}</span>
            </div>
            <div className="rankings-list">
              {col.items.length === 0 ? (
                <div className="rankings-empty">Sem dados disponíveis</div>
              ) : col.items.map((item, i) => (
                <div key={item.symbol} className="rankings-row" onClick={() => navigate(`/ticker/${item.symbol}`)}>
                  <span className="rankings-rank">#{i + 1}</span>
                  <TickerLogo className="rankings-logo" src={item.logoUrl} alt={item.symbol} />
                  <div className="rankings-info">
                    <span className="rankings-symbol">{item.symbol}</span>
                    <span className="rankings-name">{item.name}</span>
                  </div>
                  <span className="rankings-value">{col.fmt(item.value)}</span>
                  <span className="rankings-arrow">›</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Ibovespa ─────────────────────────────────────────────────────────────────

interface IbovPoint { date: number; close: number }
interface IbovData {
  currentPrice: number
  changePercent: number
  previousClose: number
  open: number
  points: IbovPoint[]
}

const IBOV_RANGES = ['1d', '5d', '1mo', '6mo', '1y', '5y'] as const
const IBOV_LABELS: Record<string, string> = { '1d': '1 D', '5d': '5 D', '1mo': '30 D', '6mo': '6 M', '1y': '1 A', '5y': '5 A' }

function fmtIbovDate(ts: number, range: string) {
  const d = new Date(ts * 1000)
  if (range === '1d') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function IbovespaCard() {
  const [range, setRange] = useState('1d')
  const [data, setData] = useState<IbovData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<IbovData>(`/api/ibovespa?range=${range}`)
      .then(r => { setData(r.data); setUpdatedAt(new Date()) })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [range])

  const up = (data?.changePercent ?? 0) >= 0
  const chartColor = up ? '#22c55e' : '#ef4444'
  const chartPoints = (data?.points ?? []).map(p => ({ date: p.date, close: p.close }))

  // Reduce tick density for large datasets
  const tickInterval = chartPoints.length > 60 ? Math.floor(chartPoints.length / 6) : 'preserveStartEnd'

  return (
    <div className="ibov-card">
      <div className="ibov-header">
        <h3 className="ibov-title">Ibovespa</h3>
      </div>

      {loading ? (
        <div className="ibov-loading">Carregando…</div>
      ) : data && data.currentPrice > 0 ? (
        <>
          <div className="ibov-price-row">
            <span className="ibov-price">
              {data.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pontos
            </span>
            <span className={`ibov-badge ${up ? 'ibov-badge--up' : 'ibov-badge--down'}`}>
              {up ? '▲' : '▼'} {Math.abs(data.changePercent).toFixed(2)}%
            </span>
          </div>
          <div className="ibov-meta">
            Fechamento anterior: {data.previousClose.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            &nbsp;•&nbsp;
            Abertura: {data.open.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="ibov-range-tabs">
            {IBOV_RANGES.map(r => (
              <button
                key={r}
                className={`ibov-range-tab ${range === r ? 'ibov-range-tab--active' : ''}`}
                onClick={() => setRange(r)}
              >
                {IBOV_LABELS[r]}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ibovGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={ts => fmtIbovDate(ts as number, range)}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval as never}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                width={42}
              />
              <Tooltip
                labelFormatter={ts => fmtIbovDate(ts as number, range)}
                formatter={(v) => [Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 'Pontos']}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#ibovGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {updatedAt && (
            <div className="ibov-updated">
              ⏱ Atualizado em {updatedAt.toLocaleDateString('pt-BR')} às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h.
            </div>
          )}
        </>
      ) : (
        <div className="ibov-empty">Dados indisponíveis.</div>
      )}
    </div>
  )
}

interface MoverRowProps {
  rank: number
  ticker: Ticker
}

function MoverRow({ rank, ticker }: MoverRowProps) {
  const navigate = useNavigate()
  const up = (ticker.changePercent ?? 0) >= 0
  return (
    <div className="mover-row" onClick={() => navigate(`/ticker/${ticker.symbol}`)}>
      <span className="mover-rank">#{rank}</span>
      <TickerLogo className="mover-logo" src={ticker.logoUrl} alt={ticker.symbol} />
      <div className="mover-info">
        <span className="mover-symbol">{ticker.symbol}</span>
        <span className="mover-price">{fmtBRL(ticker.lastPrice)}</span>
      </div>
      <span className={`mover-badge ${up ? 'mover-badge--up' : 'mover-badge--down'}`}>
        {fmtPct(ticker.changePercent)}
      </span>
    </div>
  )
}

export function Dashboard() {
  const { tickers, loading, error } = useTickers()
  const { t } = useI18n()

  const advancing = tickers.filter(tk => (tk.changePercent ?? 0) > 0).length
  const declining = tickers.filter(tk => (tk.changePercent ?? 0) < 0).length
  const neutral = tickers.length - advancing - declining
  const advancingPct = tickers.length > 0 ? Math.round((advancing / tickers.length) * 100) : 0
  const decliningPct = tickers.length > 0 ? Math.round((declining / tickers.length) * 100) : 0

  // Minimum volume filter to exclude illiquid assets with unrealistic % swings
  const MIN_VOLUME = 500_000
  const liquid = tickers.filter(tk => (tk.volume ?? 0) >= MIN_VOLUME && tk.changePercent != null)

  const topGainers = [...liquid]
    .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
    .slice(0, 5)

  const topLosers = [...liquid]
    .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))
    .slice(0, 5)

  if (loading) return <div className="dashboard-state">{t.dashboard.loading}</div>
  if (error) return <div className="dashboard-state dashboard-state--error">Error: {error}</div>

  return (
    <div className="dashboard-wrap">
      <TickerTape />
      <div className="page-container dashboard">
        {/* Market Pulse */}
        <section className="market-pulse">
          <div className="pulse-header">
            <div className="pulse-title-group">
              <div className="pulse-dot" />
              <h2 className="pulse-title">{t.dashboard.marketPulse}</h2>
            </div>
            <span className="pulse-total">{tickers.length} {t.dashboard.tickerCount}</span>
          </div>

          <div className="pulse-stats">
            <div className="pulse-stat pulse-stat--up">
              <div className="pulse-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <div className="pulse-stat-body">
                <span className="pulse-stat-value">{advancing}</span>
                <span className="pulse-stat-label">{t.dashboard.advancing}</span>
              </div>
              <span className="pulse-stat-pct">{advancingPct}%</span>
            </div>

            <div className="pulse-breadth">
              <div className="breadth-bar">
                <div className="breadth-up" style={{ width: `${advancingPct}%` }} />
                <div className="breadth-neutral" style={{ width: `${tickers.length > 0 ? Math.round((neutral / tickers.length) * 100) : 0}%` }} />
                <div className="breadth-down" style={{ width: `${decliningPct}%` }} />
              </div>
              <div className="breadth-legend">
                <span className="breadth-legend-item breadth-legend-item--up">
                  <span className="breadth-dot breadth-dot--up" />{advancingPct}% ↑
                </span>
                <span className="breadth-legend-item">
                  <span className="breadth-dot breadth-dot--neutral" />{neutral} {t.dashboard.neutral}
                </span>
                <span className="breadth-legend-item breadth-legend-item--down">
                  <span className="breadth-dot breadth-dot--down" />{decliningPct}% ↓
                </span>
              </div>
            </div>

            <div className="pulse-stat pulse-stat--down">
              <div className="pulse-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                  <polyline points="16 17 22 17 22 11" />
                </svg>
              </div>
              <div className="pulse-stat-body">
                <span className="pulse-stat-value">{declining}</span>
                <span className="pulse-stat-label">{t.dashboard.declining}</span>
              </div>
              <span className="pulse-stat-pct">{decliningPct}%</span>
            </div>
          </div>
        </section>

        {/* Top Movers + Distribution */}
        <div className="dashboard-grid">
          <div className="movers-card">
            <div className="movers-card-header movers-card-header--up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="movers-icon">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <span>{t.dashboard.topGainers}</span>
            </div>
            <div className="movers-list">
              {topGainers.map((tk, i) => (
                <MoverRow key={tk.symbol} rank={i + 1} ticker={tk} />
              ))}
            </div>
          </div>

          <IbovespaCard />

          <div className="movers-card">
            <div className="movers-card-header movers-card-header--down">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="movers-icon">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                <polyline points="16 17 22 17 22 11" />
              </svg>
              <span>{t.dashboard.topLosers}</span>
            </div>
            <div className="movers-list">
              {topLosers.map((tk, i) => (
                <MoverRow key={tk.symbol} rank={i + 1} ticker={tk} />
              ))}
            </div>
          </div>
        </div>

        <RankingsSection />
        <NewsSection />
      </div>
    </div>
  )
}
