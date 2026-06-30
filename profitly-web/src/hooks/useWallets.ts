import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { WalletSummary } from '../types/WalletSummary'

export function useWallets() {
  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<WalletSummary[]>('/api/wallets')
      .then(res => setWallets(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [])

  return { wallets, setWallets, loading, error }
}
