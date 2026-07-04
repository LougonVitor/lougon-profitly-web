import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { FiiIndicator, FiiIndicatorHistory } from '../types/FiiIndicator'

export function useFiiIndicator(symbol: string | null) {
  const [indicator, setIndicator] = useState<FiiIndicator | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<FiiIndicator>(`/api/fii/indicators/${symbol}`)
      .then(r => setIndicator(r.data))
      .catch(() => setIndicator(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { indicator, loading }
}

export function useFiiIndicatorHistory(symbol: string | null) {
  const [history, setHistory] = useState<FiiIndicatorHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<FiiIndicatorHistory[]>(`/api/fii/indicators/${symbol}/history`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [symbol])

  return { history, loading }
}
