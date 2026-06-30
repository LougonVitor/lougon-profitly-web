import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { PriceHistory, TickerAnalysis } from '../types/TickerAnalysis'

export function useTickerAnalysis(symbol: string) {
  const [analysis, setAnalysis] = useState<TickerAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError(null)
    api.get<TickerAnalysis>(`/api/analysis/${symbol}`)
      .then(res => setAnalysis(res.data))
      .catch(e => setError(e.response?.data?.message ?? 'Erro ao carregar análise'))
      .finally(() => setLoading(false))
  }, [symbol])

  return { analysis, loading, error }
}

export function usePriceHistory(symbol: string, range: string) {
  const [history, setHistory] = useState<PriceHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<PriceHistory>(`/api/analysis/${symbol}/history?range=${range}`)
      .then(res => setHistory(res.data))
      .catch(() => setHistory(null))
      .finally(() => setLoading(false))
  }, [symbol, range])

  return { history, loading }
}
