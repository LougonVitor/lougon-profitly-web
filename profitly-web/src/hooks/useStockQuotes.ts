import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { StockQuote } from '../types/StockQuote'

export function useStockQuotes() {
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<StockQuote[]>('/api/stocks/quote')
      .then(res => setStocks(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return { stocks, loading, error }
}
