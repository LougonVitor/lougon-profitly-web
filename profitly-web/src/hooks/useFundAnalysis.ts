import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { FundAnalysis } from '../types/FundAnalysis'

export function useFundAnalysis(symbol: string) {
  const [data, setData] = useState<FundAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<FundAnalysis>(`/api/funds/analysis/${symbol}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading }
}
