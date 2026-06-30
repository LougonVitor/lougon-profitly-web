import { useParams, useNavigate } from 'react-router-dom'
import { useTickers } from '../../hooks/useTickers'
import { useI18n } from '../../i18n/I18nContext'
import { Header } from '../../components/Header/Header'
import './TickerDetail.css'

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function fmtCap(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `R$ ${(v / 1e9).toFixed(1)}B`
  return `R$ ${(v / 1e6).toFixed(0)}M`
}

function fmtVol(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return String(v)
}

export function TickerDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { tickers, loading } = useTickers()
  const { t } = useI18n()

  const ticker = tickers.find(tk => tk.symbol === symbol?.toUpperCase())
  const up = (ticker?.changePercent ?? 0) >= 0
  const assetLabel = ticker?.subType ?? ticker?.assetType ?? '—'

  const assetTypeLabel = (key: string) =>
    (t.assetType as Record<string, string>)[key.toLowerCase()] ?? key.toUpperCase()

  if (loading) {
    return (
      <div className="ticker-detail">
        <Header search="" onSearch={() => {}} />
        <div className="ticker-detail-state">{t.dashboard.loading}</div>
      </div>
    )
  }

  if (!ticker) {
    return (
      <div className="ticker-detail">
        <Header search="" onSearch={() => {}} />
        <div className="ticker-detail-state">Ticker não encontrado: {symbol}</div>
      </div>
    )
  }

  return (
    <div className="ticker-detail">
      <Header search="" onSearch={() => {}} />

      {/* Breadcrumb */}
      <nav className="td-breadcrumb">
        <button className="td-breadcrumb-btn" onClick={() => navigate('/')}>
          {t.nav.tickers}
        </button>
        <span className="td-breadcrumb-sep">›</span>
        {ticker.assetType && (
          <>
            <span className="td-breadcrumb-part">{assetTypeLabel(assetLabel)}</span>
            <span className="td-breadcrumb-sep">›</span>
          </>
        )}
        <span className="td-breadcrumb-active">{ticker.symbol}</span>
      </nav>

      {/* Hero header */}
      <div className="td-hero">
        <div className="td-hero-left">
          <div className="td-logo-wrap">
            <img
              className="td-logo"
              src={ticker.logoUrl ?? ''}
              alt={ticker.symbol}
              onError={e => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="td-logo-fallback" style={{ display: 'none' }}>
              {ticker.symbol.slice(0, 2)}
            </div>
          </div>

          <div className="td-hero-info">
            <div className="td-hero-top">
              <h1 className="td-symbol">{ticker.symbol}</h1>
              {assetLabel !== '—' && (
                <span className={`td-type-badge td-type-badge--${assetLabel.toLowerCase().replace('-', '_')}`}>
                  {assetTypeLabel(assetLabel)}
                </span>
              )}
            </div>
            <div className="td-long-name">{ticker.longName ?? ticker.name}</div>
            {ticker.sector && (
              <div className="td-sector">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="td-sector-icon">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {ticker.sector}
              </div>
            )}
          </div>
        </div>

        <div className="td-hero-price">
          <div className="td-price">{fmtBRL(ticker.lastPrice)}</div>
          <div className={`td-change ${up ? 'td-change--up' : 'td-change--down'}`}>
            <span className="td-change-arrow">{up ? '▲' : '▼'}</span>
            {fmtPct(ticker.changePercent)}
            <span className="td-change-label">hoje</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="td-metrics">
        <div className="td-metric-card">
          <div className="td-metric-icon td-metric-icon--price">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="td-metric-body">
            <div className="td-metric-label">Cotação</div>
            <div className="td-metric-value">{fmtBRL(ticker.lastPrice)}</div>
          </div>
        </div>

        <div className="td-metric-card">
          <div className={`td-metric-icon ${up ? 'td-metric-icon--up' : 'td-metric-icon--down'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {up
                ? <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>
                : <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>
              }
            </svg>
          </div>
          <div className="td-metric-body">
            <div className="td-metric-label">Variação (dia)</div>
            <div className={`td-metric-value ${up ? 'td-metric-value--up' : 'td-metric-value--down'}`}>
              {fmtPct(ticker.changePercent)}
            </div>
          </div>
        </div>

        <div className="td-metric-card">
          <div className="td-metric-icon td-metric-icon--vol">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <div className="td-metric-body">
            <div className="td-metric-label">Volume</div>
            <div className="td-metric-value">{fmtVol(ticker.volume)}</div>
          </div>
        </div>

        <div className="td-metric-card">
          <div className="td-metric-icon td-metric-icon--cap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="td-metric-body">
            <div className="td-metric-label">Valor de Mercado</div>
            <div className="td-metric-value">{fmtCap(ticker.marketCap)}</div>
          </div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="td-chart-card">
        <div className="td-chart-header">
          <div>
            <div className="td-chart-title">Cotação {ticker.symbol}</div>
            <div className="td-chart-sub">Histórico de preços</div>
          </div>
        </div>

        <div className="td-chart-placeholder">
          <div className="td-chart-placeholder-icon">
            <svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline
                points="0,40 10,35 20,38 30,20 40,25 50,10 60,15 70,5 80,8"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />
              <polyline
                points="0,40 10,35 20,38 30,20 40,25 50,10 60,15 70,5 80,8 80,50 0,50"
                fill="var(--accent)"
                opacity="0.08"
              />
            </svg>
          </div>
          <div className="td-chart-placeholder-text">Gráfico histórico em breve</div>
          <div className="td-chart-placeholder-sub">
            Integração com dados históricos será adicionada em uma próxima versão
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="td-info-grid">
        <div className="td-info-card">
          <div className="td-info-title">Informações do Ativo</div>
          <div className="td-info-rows">
            <div className="td-info-row">
              <span className="td-info-key">Símbolo</span>
              <span className="td-info-val">{ticker.symbol}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Nome</span>
              <span className="td-info-val">{ticker.longName ?? ticker.name ?? '—'}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Tipo</span>
              <span className="td-info-val">{assetLabel !== '—' ? assetTypeLabel(assetLabel) : '—'}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Setor</span>
              <span className="td-info-val">{ticker.sector ?? '—'}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Status</span>
              <span className={`td-info-val ${ticker.isActive ? 'td-info-val--active' : 'td-info-val--inactive'}`}>
                {ticker.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        <div className="td-info-card">
          <div className="td-info-title">Dados de Mercado</div>
          <div className="td-info-rows">
            <div className="td-info-row">
              <span className="td-info-key">Preço atual</span>
              <span className="td-info-val">{fmtBRL(ticker.lastPrice)}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Variação</span>
              <span className={`td-info-val ${up ? 'td-info-val--up' : 'td-info-val--down'}`}>
                {fmtPct(ticker.changePercent)}
              </span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Volume</span>
              <span className="td-info-val">{fmtVol(ticker.volume)}</span>
            </div>
            <div className="td-info-row">
              <span className="td-info-key">Valor de Mercado</span>
              <span className="td-info-val">{fmtCap(ticker.marketCap)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
