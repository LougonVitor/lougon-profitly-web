import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TickerTape } from '../../components/TickerTape/TickerTape'
import { useTickers } from '../../hooks/useTickers'
import { useI18n } from '../../i18n/I18nContext'
import { api } from '../../lib/api'
import type { Ticker } from '../../types/Ticker'
import './Dashboard.css'

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function buildDistribution(tickers: Ticker[]) {
  const buckets = [
    { label: '< -5%', min: -Infinity, max: -5 },
    { label: '-5 a -3%', min: -5, max: -3 },
    { label: '-3 a -1%', min: -3, max: -1 },
    { label: '-1 a 0%', min: -1, max: 0 },
    { label: '0 a +1%', min: 0, max: 1 },
    { label: '+1 a +3%', min: 1, max: 3 },
    { label: '+3 a +5%', min: 3, max: 5 },
    { label: '> +5%', min: 5, max: Infinity },
  ]
  return buckets.map(b => ({
    label: b.label,
    count: tickers.filter(t => {
      const p = t.changePercent ?? 0
      return p >= b.min && p < b.max
    }).length,
    positive: b.min >= 0,
  }))
}

// ── Rankings ──────────────────────────────────────────────────────────────────

interface RankingItem { symbol: string; name: string; logoUrl: string | null; value: number }
interface Rankings { dividendYield: RankingItem[]; marketCap: RankingItem[]; revenue: RankingItem[] }

const ASSET_TYPE_TABS = [
  { label: 'Ações', value: 'stock' },
  { label: 'FIIs', value: 'fund' },
  { label: 'Stocks', value: 'bdr' },
  { label: 'Criptomoedas', value: 'crypto' },
]

function fmtCompact(v: number): string {
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)} T`
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)} B`
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)} M`
  return `R$ ${v.toFixed(0)}`
}

function RankingsSection() {
  const [assetType, setAssetType] = useState('stock')
  const [rankings, setRankings] = useState<Rankings | null>(null)

  useEffect(() => {
    api.get<Rankings>(`/api/rankings?assetType=${assetType}`)
      .then(r => setRankings(r.data))
      .catch(() => setRankings(null))
  }, [assetType])

  const cols: { title: string; icon: string; items: RankingItem[]; fmt: (v: number) => string }[] = [
    {
      title: 'Maiores Dividend Yield',
      icon: '◎',
      items: rankings?.dividendYield ?? [],
      fmt: v => `${(v * 100).toFixed(2)}%`,
    },
    {
      title: 'Maiores Valor de Mercado',
      icon: '▦',
      items: rankings?.marketCap ?? [],
      fmt: fmtCompact,
    },
    {
      title: 'Maiores Receitas',
      icon: '↗',
      items: rankings?.revenue ?? [],
      fmt: fmtCompact,
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
                <div key={item.symbol} className="rankings-row">
                  <span className="rankings-rank">#{i + 1}</span>
                  {item.logoUrl ? (
                    <img
                      className="rankings-logo"
                      src={item.logoUrl}
                      alt={item.symbol}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <div className="rankings-logo-placeholder">{item.symbol[0]}</div>
                  )}
                  <div className="rankings-info">
                    <span className="rankings-symbol">{item.symbol}</span>
                    <span className="rankings-name">{item.name}</span>
                  </div>
                  <span className="rankings-value">{col.fmt(item.value)}</span>
                  <span className="rankings-arrow">›</span>
                </div>
              ))}
            </div>
            <button className="rankings-view-btn">Ver Rankings</button>
          </div>
        ))}
      </div>
    </section>
  )
}

interface MoverRowProps {
  rank: number
  ticker: Ticker
}

function MoverRow({ rank, ticker }: MoverRowProps) {
  const up = (ticker.changePercent ?? 0) >= 0
  return (
    <div className="mover-row">
      <span className="mover-rank">#{rank}</span>
      <img
        className="mover-logo"
        src={ticker.logoUrl ?? ''}
        alt={ticker.symbol}
        onError={e => (e.currentTarget.style.display = 'none')}
      />
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

  const distribution = buildDistribution(tickers)

  if (loading) return <div className="dashboard-state">{t.dashboard.loading}</div>
  if (error) return <div className="dashboard-state dashboard-state--error">Error: {error}</div>

  return (
    <div className="dashboard-wrap">
      <TickerTape />
      <div className="dashboard">
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

          <div className="dist-card">
            <div className="dist-header">
              <div className="dist-title">{t.dashboard.distribution}</div>
              <div className="dist-sub">{t.dashboard.distributionSub}</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 0, left: -24 }} barSize={24}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)' }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  formatter={(value: unknown) => [String(value), 'ativos']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.positive ? 'var(--text-up)' : 'var(--text-down)'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

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
      </div>
    </div>
  )
}
