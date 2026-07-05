import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { CryptoAnalysis } from '../types/CryptoAnalysis'

export function useCryptoAnalysis(coin: string) {
  const [data, setData] = useState<CryptoAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!coin) return
    setLoading(true)
    api.get<CryptoAnalysis>(`/api/crypto/analysis/${coin}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [coin])

  return { data, loading }
}
