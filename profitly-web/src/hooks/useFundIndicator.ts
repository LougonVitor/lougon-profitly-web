import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface FundIndicator {
  symbol: string
  name: string | null
  fundType: string | null
  price: number | null
  dividendYield12m: number | null
  dividendYield1m: number | null
  priceToNav: number | null
  navPerShare: number | null
  totalInvestors: number | null
  adminName: string | null
  adminCnpj: string | null
  segmentType: string | null
  syncedAt: string | null
}

export function useFundIndicator(symbol: string | null) {
  const [indicator, setIndicator] = useState<FundIndicator | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<FundIndicator>(`/api/funds/indicators/${symbol}`)
      .then(r => setIndicator(r.data))
      .catch(() => setIndicator(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { indicator, loading }
}
