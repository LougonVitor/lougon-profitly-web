import { useState, useRef, useEffect } from 'react'
import type { Ticker } from '../../types/Ticker'
import './TickerSelect.css'

interface TickerSelectProps {
  tickers: Ticker[]
  value: string
  onChange: (symbol: string) => void
}

// Treasury symbols are slugs (tesouro-ipca-15052029) — show the official name
// as the title and the asset class as the subtitle instead.
function displayTitle(t: Ticker) {
  return t.symbol.startsWith('tesouro-') ? (t.longName ?? t.name ?? t.symbol) : t.symbol
}

function displaySubtitle(t: Ticker) {
  return t.symbol.startsWith('tesouro-') ? 'Tesouro Direto' : (t.longName ?? t.name)
}

export function TickerSelect({ tickers, value, onChange }: TickerSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = tickers.find(t => t.symbol === value)

  const filtered = query.trim()
    ? tickers.filter(t =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        (t.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : tickers

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSelect(symbol: string) {
    onChange(symbol)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="ticker-select" ref={containerRef}>
      <button type="button" className={`ticker-trigger ${open ? 'ticker-trigger--open' : ''}`} onClick={handleOpen}>
        {selected ? (
          <div className="ticker-selected-item">
            <div className="ticker-logo-wrap">
              {selected.logoUrl ? (
                <img src={selected.logoUrl} alt={selected.symbol} className="ticker-logo"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <span className="ticker-logo-fallback">{selected.symbol[0]}</span>
              )}
            </div>
            <div className="ticker-info">
              <span className="ticker-symbol">{displayTitle(selected)}</span>
              <span className="ticker-name">{displaySubtitle(selected)}</span>
            </div>
          </div>
        ) : (
          <span className="ticker-placeholder">Selecione um ativo...</span>
        )}
        <span className="ticker-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ticker-dropdown">
          <div className="ticker-search-wrap">
            <input
              ref={inputRef}
              className="ticker-search"
              type="text"
              placeholder="Buscar por ticker ou nome..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <ul className="ticker-list">
            {filtered.slice(0, 80).map(t => (
              <li
                key={t.symbol}
                className={`ticker-option ${t.symbol === value ? 'ticker-option--selected' : ''}`}
                onClick={() => handleSelect(t.symbol)}
              >
                <div className="ticker-logo-wrap">
                  {t.logoUrl ? (
                    <img src={t.logoUrl} alt={t.symbol} className="ticker-logo"
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="ticker-logo-fallback">{t.symbol[0]}</span>
                  )}
                </div>
                <div className="ticker-info">
                  <span className="ticker-symbol">{displayTitle(t)}</span>
                  <span className="ticker-name">{displaySubtitle(t)}</span>
                </div>
                {t.symbol === value && <span className="ticker-check">✓</span>}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="ticker-empty">Nenhum resultado para "{query}"</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
