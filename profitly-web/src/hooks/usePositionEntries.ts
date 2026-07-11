import { useState } from 'react'
import { api } from '../lib/api'
import type { WalletSummary } from '../types/WalletSummary'

interface EntryPayload {
  date: string
  quantity: number
  paidPrice: number
  type?: 'BUY' | 'SELL'
}

export function usePositionEntries() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addEntry(walletId: string, ticker: string, payload: EntryPayload): Promise<WalletSummary | null> {
    return request('post', `/api/wallets/${walletId}/positions/${ticker}/entries`, payload)
  }

  async function updateEntry(walletId: string, ticker: string, entryId: string, payload: EntryPayload): Promise<WalletSummary | null> {
    return request('put', `/api/wallets/${walletId}/positions/${ticker}/entries/${entryId}`, payload)
  }

  async function deleteEntry(walletId: string, ticker: string, entryId: string): Promise<WalletSummary | null> {
    return request('delete', `/api/wallets/${walletId}/positions/${ticker}/entries/${entryId}`)
  }

  async function deletePosition(walletId: string, ticker: string): Promise<WalletSummary | null> {
    return request('delete', `/api/wallets/${walletId}/positions/${ticker}`)
  }

  async function request(method: 'post' | 'put' | 'delete', url: string, data?: unknown): Promise<WalletSummary | null> {
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

  return { addEntry, updateEntry, deleteEntry, deletePosition, loading, error }
}
