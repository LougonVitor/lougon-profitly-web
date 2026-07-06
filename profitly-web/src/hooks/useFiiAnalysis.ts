import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { FiiAnalysis } from '../types/FiiAnalysis'

export function useFiiAnalysis(symbol: string) {
  const [data, setData] = useState<FiiAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<FiiAnalysis>(`/api/fii/analysis/${symbol}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading }
}
