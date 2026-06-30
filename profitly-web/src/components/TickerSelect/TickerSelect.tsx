import { useState, useRef, useEffect } from 'react'
import type { StockQuote } from '../../types/StockQuote'
import './TickerSelect.css'

interface TickerSelectProps {
  stocks: StockQuote[]
  value: string
  onChange: (symbol: string) => void
}

export function TickerSelect({ stocks, value, onChange }: TickerSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = stocks.find(s => s.symbol === value)

  const filtered = query.trim()
    ? stocks.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.longName.toLowerCase().includes(query.toLowerCase())
      )
    : stocks

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
              <span className="ticker-symbol">{selected.symbol}</span>
              <span className="ticker-name">{selected.longName}</span>
            </div>
          </div>
        ) : (
          <span className="ticker-placeholder">Select a stock...</span>
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
              placeholder="Search ticker or name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <ul className="ticker-list">
            {filtered.slice(0, 80).map(stock => (
              <li
                key={stock.symbol}
                className={`ticker-option ${stock.symbol === value ? 'ticker-option--selected' : ''}`}
                onClick={() => handleSelect(stock.symbol)}
              >
                <div className="ticker-logo-wrap">
                  {stock.logoUrl ? (
                    <img src={stock.logoUrl} alt={stock.symbol} className="ticker-logo"
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="ticker-logo-fallback">{stock.symbol[0]}</span>
                  )}
                </div>
                <div className="ticker-info">
                  <span className="ticker-symbol">{stock.symbol}</span>
                  <span className="ticker-name">{stock.longName}</span>
                </div>
                {stock.symbol === value && <span className="ticker-check">✓</span>}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="ticker-empty">No results for "{query}"</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
