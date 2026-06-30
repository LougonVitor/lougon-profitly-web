import { NavLink, useNavigate } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  search?: string
  onSearch?: (value: string) => void
}

export function Header({ search, onSearch }: HeaderProps) {
  const navigate = useNavigate()
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
            Stocks
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
            Wallet
          </NavLink>
        </nav>
      </div>
      <div className="header-right">
        {onSearch !== undefined && (
          <input
            className="header-search"
            type="text"
            placeholder="Search ticker..."
            value={search ?? ''}
            onChange={e => onSearch(e.target.value)}
          />
        )}
        {username && (
          <div className="header-user">
            <span className="header-username">{username}</span>
            <button className="header-logout" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}
