import { useState } from 'react'
import { api } from '../lib/api'
import type { FixedIncomeIndexer, FixedIncomeInstrumentType, WalletSummary } from '../types/WalletSummary'

interface AddFixedIncomePayload {
  issuer: string
  instrumentType: FixedIncomeInstrumentType
  indexer: FixedIncomeIndexer
  ratePercent: number
  dailyLiquidity: boolean
  principal: number
  transactionDate: string
  maturityDate: string
}

export function useFixedIncome() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addFixedIncomeEntry(walletId: string, payload: AddFixedIncomePayload): Promise<WalletSummary | null> {
    return request('post', `/api/wallets/${walletId}/fixed-income`, payload)
  }

  async function redeemFixedIncome(walletId: string, ticker: string, date: string): Promise<WalletSummary | null> {
    return request('post', `/api/wallets/${walletId}/positions/${ticker}/redeem`, { date })
  }

  async function request(method: 'post', url: string, data: unknown): Promise<WalletSummary | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await api<WalletSummary>({ method, url, data })
      return res.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { addFixedIncomeEntry, redeemFixedIncome, loading, error }
}
