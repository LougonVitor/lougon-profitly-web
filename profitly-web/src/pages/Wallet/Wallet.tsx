import { useState } from 'react'
import { Header } from '../../components/Header/Header'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { AddPositionModal } from '../../components/AddPositionModal/AddPositionModal'
import { useWallets } from '../../hooks/useWallets'
import type { WalletSummary } from '../../types/WalletSummary'
import './Wallet.css'

export function Wallet() {
  const { wallets, setWallets, loading, error } = useWallets()
  const [activeModal, setActiveModal] = useState<string | null>(null)

  function handleWalletUpdate(updated: WalletSummary) {
    setWallets(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  function handlePositionAdded(updated: WalletSummary) {
    handleWalletUpdate(updated)
    setActiveModal(null)
  }

  if (loading) return (
    <div className="wallet-page">
      <Header />
      <div className="wallet-skeleton">
        <div className="skeleton-card" />
        <div className="skeleton-table" />
      </div>
    </div>
  )

  if (error) return (
    <div className="wallet-page">
      <Header />
      <div className="wallet-state wallet-state--error">Failed to load wallets: {error}</div>
    </div>
  )

  return (
    <div className="wallet-page">
      <Header />

      {wallets.length === 0 && (
        <div className="wallet-state">No wallets found.</div>
      )}

      {wallets.map((wallet, i) => (
        <div key={wallet.id} className="wallet-section">
          <WalletCard wallet={wallet} index={i} onAddPosition={() => setActiveModal(wallet.id)} />
          <PositionTable walletId={wallet.id} positions={wallet.positions} onWalletUpdate={handleWalletUpdate} />
        </div>
      ))}

      {activeModal && (() => {
        const wallet = wallets.find(w => w.id === activeModal)!
        return (
          <AddPositionModal
            walletId={wallet.id}
            walletName={wallet.name}
            onClose={() => setActiveModal(null)}
            onSuccess={handlePositionAdded}
          />
        )
      })()}
    </div>
  )
}
