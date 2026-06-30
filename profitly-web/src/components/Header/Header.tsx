import { NavLink, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useTheme } from '../../i18n/ThemeContext'
import type { Lang } from '../../i18n/translations'
import './Header.css'

interface HeaderProps {
  search?: string
  onSearch?: (value: string) => void
}

const LANGS: { value: Lang; label: string }[] = [
  { value: 'pt', label: 'PT' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export function Header({ search, onSearch }: HeaderProps) {
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const username = localStorage.getItem('profitly_username')

  function handleLogout() {
    localStorage.removeItem('profitly_token')
    localStorage.removeItem('profitly_username')
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Profit<span className="logo-accent">ly</span></span>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            {t.nav.tickers}
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            {t.nav.wallet}
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        {onSearch !== undefined && (
          <input
            className="header-search"
            type="text"
            placeholder={t.header.search}
            value={search ?? ''}
            onChange={e => onSearch(e.target.value)}
          />
        )}

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

        {username && (
          <div className="header-user">
            <div className="header-avatar">{username[0].toUpperCase()}</div>
            <button className="header-logout" onClick={handleLogout}>{t.header.logout}</button>
          </div>
        )}
      </div>
    </header>
  )
}
