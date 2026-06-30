import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Ticker } from '../types/Ticker'

export function useTickers() {
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Ticker[]>('/api/tickers')
      .then(res => setTickers(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return { tickers, loading, error }
}
