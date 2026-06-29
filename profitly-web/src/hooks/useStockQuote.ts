import { useEffect, useState } from 'react'
import type { StockQuote } from '../types/StockQuote'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function useStockQuotes() {
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stocks`)
        if (!response.ok) throw new Error('Failed to fetch stocks')
        const data: StockQuote[] = await response.json()
        setStocks(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  return { stocks, loading, error }
}