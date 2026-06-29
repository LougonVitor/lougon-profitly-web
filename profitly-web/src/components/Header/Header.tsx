import { NavLink } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  search?: string
  onSearch?: (value: string) => void
}

export function Header({ search, onSearch }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Profit<span className="logo-accent">ly</span></span>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            Stocks
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            Wallet
          </NavLink>
        </nav>
      </div>
      {onSearch !== undefined && (
        <input
          className="header-search"
          type="text"
          placeholder="Search ticker..."
          value={search ?? ''}
          onChange={e => onSearch(e.target.value)}
        />
      )}
    </header>
  )
}