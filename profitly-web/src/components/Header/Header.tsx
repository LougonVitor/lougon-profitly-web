import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useTheme } from '../../i18n/ThemeContext'
import { useTickers } from '../../hooks/useTickers'
import type { Lang } from '../../i18n/translations'
import type { Ticker } from '../../types/Ticker'
import './Header.css'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'pt', label: 'PT' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toFixed(2)}`
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

/** Treasury symbols are slugs like "tesouro-ipca-com-juros-semestrais-15052029".
 *  Show the friendly name as the title and the maturity date as the subtitle. */
function treasuryDisplay(ticker: Ticker): { title: string; subtitle: string } | null {
  if (!ticker.symbol.startsWith('tesouro-')) return null
  const title = ticker.name ?? ticker.longName ?? ticker.symbol
  const m = ticker.symbol.match(/(\d{2})(\d{2})(\d{4})$/)
  const subtitle = m ? `Vencimento ${m[1]}/${m[2]}/${m[3]}` : ticker.symbol
  return { title, subtitle }
}

interface SearchResultProps {
  ticker: Ticker
  onSelect: () => void
}

function SearchResult({ ticker, onSelect }: SearchResultProps) {
  const navigate = useNavigate()
  const up = (ticker.changePercent ?? 0) >= 0
  const treasury = treasuryDisplay(ticker)

  function handleClick() {
    onSelect()
    navigate(`/ticker/${ticker.symbol}`)
  }

  return (
    <button className="search-result" onClick={handleClick}>
      <div className="search-result-logo-wrap">
        {ticker.logoUrl && !treasury ? (
          <img
            className="search-result-logo"
            src={ticker.logoUrl}
            alt={ticker.symbol}
            onError={e => {
              e.currentTarget.style.display = 'none'
              const fb = e.currentTarget.nextElementSibling as HTMLElement
              if (fb) fb.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="search-result-logo-fallback"
          style={ticker.logoUrl && !treasury ? undefined : { display: 'flex' }}
        >
          {treasury ? 'TD' : ticker.symbol.slice(0, 2).toUpperCase()}
        </div>
      </div>
      <div className="search-result-info">
        <span className="search-result-symbol">{treasury ? treasury.title : ticker.symbol}</span>
        <span className="search-result-name">{treasury ? treasury.subtitle : (ticker.longName ?? ticker.name)}</span>
      </div>
      <div className="search-result-right">
        <span className="search-result-price">{fmtBRL(ticker.lastPrice)}</span>
        <span className={`search-result-change ${up ? 'search-result-change--up' : 'search-result-change--down'}`}>
          {fmtPct(ticker.changePercent)}
        </span>
      </div>
    </button>
  )
}

export function Header() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { tickers } = useTickers()
  const username = localStorage.getItem('profitly_username')

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const q = search.trim().toLowerCase()
  const results = q.length >= 1
    ? tickers
        .map(tk => {
          const symbol = tk.symbol.toLowerCase()
          const name = (tk.longName ?? tk.name ?? '').toLowerCase()
          let score = -1
          if (symbol === q) score = 0
          else if (symbol.startsWith(q)) score = 1
          else if (name.startsWith(q)) score = 2
          else if (symbol.includes(q)) score = 3
          else if (name.includes(q)) score = 4
          return { tk, score }
        })
        .filter(r => r.score >= 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 8)
        .map(r => r.tk)
    : []

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleLogout() {
    localStorage.removeItem('profitly_token')
    localStorage.removeItem('profitly_username')
    navigate('/login')
  }

  function handleSearchChange(v: string) {
    setSearch(v)
    setOpen(v.trim().length >= 1)
  }

  function handleClose() {
    setSearch('')
    setOpen(false)
  }

  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Profit<span className="logo-accent">ly</span></span>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            {t.nav.tickers}
          </NavLink>
          <NavLink to="/comparar" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            Comparar
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            {t.nav.wallet}
          </NavLink>
          <NavLink to="/finance" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            Finanças
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="header-search-wrap" ref={wrapRef}>
          <div className="header-search-box">
            <svg className="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="header-search"
              type="text"
              placeholder={t.header.search}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => search.trim().length >= 1 && setOpen(true)}
            />
            {search && (
              <button className="header-search-clear" onClick={handleClose}>✕</button>
            )}
          </div>

          {open && results.length > 0 && (
            <div className="search-dropdown">
              {results.map(tk => (
                <SearchResult key={tk.symbol} ticker={tk} onSelect={handleClose} />
              ))}
            </div>
          )}

          {open && search.trim().length >= 1 && results.length === 0 && (
            <div className="search-dropdown">
              <div className="search-empty">Nenhum resultado para "{search}"</div>
            </div>
          )}
        </div>

        <div className="header-lang">
          {LANGS.map(l => (
            <button
              key={l.value}
              className={`lang-btn ${lang === l.value ? 'lang-btn--active' : ''}`}
              onClick={() => setLang(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button className="theme-btn" onClick={toggleTheme} title={t.settings.theme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {username ? (
          <div className="header-user">
            <div className="header-avatar">{username[0].toUpperCase()}</div>
            <button className="header-logout" onClick={handleLogout}>{t.header.logout}</button>
          </div>
        ) : (
          <button className="header-login-btn" onClick={() => navigate('/login')}>Entrar</button>
        )}
      </div>
    </header>
  )
}
