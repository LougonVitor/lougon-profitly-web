import './Header.css'

interface HeaderProps {
  search: string
  onSearch: (value: string) => void
}

export function Header({ search, onSearch }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">Profit<span className="logo-accent">ly</span></span>
        <span className="header-subtitle">B3 — market quotes</span>
      </div>
      <input
        className="header-search"
        type="text"
        placeholder="Search ticker..."
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
    </header>
  )
}