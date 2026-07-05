import { useState, useEffect } from 'react'
import { api } from '../lib/api'

/** Daily Crypto Fear & Greed Index reading from /api/crypto/fear-greed. */
export interface FearGreedReading {
  date: string
  value: number
  classification: string | null
  syncedAt: string
}

export function useFearGreed(days: number) {
  const [readings, setReadings] = useState<FearGreedReading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<FearGreedReading[]>(`/api/crypto/fear-greed?days=${days}`)
      .then(res => setReadings(res.data ?? []))
      .catch(() => setReadings([]))
      .finally(() => setLoading(false))
  }, [days])

  return { readings, loading }
}
