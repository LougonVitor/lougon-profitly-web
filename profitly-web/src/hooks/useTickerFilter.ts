import { useState, useMemo } from 'react'
import type { Ticker } from '../types/Ticker'

export type FilterType = 'all' | 'up' | 'down'

export function useTickerFilter(tickers: Ticker[]) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return tickers
      .filter(t => {
        if (filter === 'up') return (t.changePercent ?? 0) >= 0
        if (filter === 'down') return (t.changePercent ?? 0) < 0
        return true
      })
      .filter(t =>
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        (t.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
  }, [tickers, filter, search])

  return { filtered, filter, setFilter, search, setSearch }
}
