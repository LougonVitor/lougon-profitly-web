import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface TreasuryBond {
  symbol: string
  name: string | null
  bondType: string | null
  indexer: string | null
  couponType: string | null
  maturityDate: string | null
  buyRate: number | null
  sellRate: number | null
  buyPrice: number | null
  sellPrice: number | null
  basePrice: number | null
  durationDays: number | null
  syncedAt: string | null
}

export interface TreasuryBondHistory {
  id: number
  symbol: string
  referenceDate: string
  buyRate: number | null
  sellRate: number | null
  buyPrice: number | null
  sellPrice: number | null
  basePrice: number | null
}

export function useTreasuryBond(symbol: string | null) {
  const [bond, setBond] = useState<TreasuryBond | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<TreasuryBond>(`/api/treasury/bonds/${symbol}`)
      .then(r => setBond(r.data))
      .catch(() => setBond(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { bond, loading }
}

export function useTreasuryBondHistory(symbol: string | null) {
  const [history, setHistory] = useState<TreasuryBondHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    api.get<TreasuryBondHistory[]>(`/api/treasury/bonds/${symbol}/history`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [symbol])

  return { history, loading }
}
