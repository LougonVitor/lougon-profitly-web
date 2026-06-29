import { useEffect, useState } from 'react'
import axios from 'axios'
import type { WalletSummary } from '../types/WalletSummary'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function useWallets() {
  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<WalletSummary[]>(`${API_BASE_URL}/api/wallets`)
      .then(res => setWallets(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return { wallets, loading, error }
}
