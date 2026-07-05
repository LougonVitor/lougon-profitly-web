import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { TreasuryAnalysis } from '../types/TreasuryAnalysis'

export function useTreasuryAnalysis(symbol: string) {
  const [data, setData] = useState<TreasuryAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<TreasuryAnalysis>(`/api/treasury/analysis/${symbol}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading }
}
