

import { useState, useMemo } from 'react'
import type { StockQuote } from '../types/StockQuote'

export type FilterType = 'all' | 'up' | 'down'

export function useStockFilter(stocks: StockQuote[]) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return stocks
      .filter(s => {
        if (filter === 'up') return s.regularMarketChange >= 0
        if (filter === 'down') return s.regularMarketChange < 0
        return true
      })
      .filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.longName.toLowerCase().includes(search.toLowerCase())
      )
  }, [stocks, filter, search])

  return { filtered, filter, setFilter, search, setSearch }
}