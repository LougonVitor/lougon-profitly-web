import { useState } from 'react'
import axios from 'axios'
import type { WalletSummary } from '../types/WalletSummary'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

interface AddPositionPayload {
  ticker: string
  quantity: number
  averagePrice: number
}

export function useAddPosition() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addPosition(walletId: string, payload: AddPositionPayload): Promise<WalletSummary | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<WalletSummary>(
        `${API_BASE_URL}/api/wallets/${walletId}/positions`,
        payload
      )
      return res.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { addPosition, loading, error }
}
