import { useState } from 'react'
import { Header } from '../../components/Header/Header'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { AddPositionModal } from '../../components/AddPositionModal/AddPositionModal'
import { CreateWalletModal } from '../../components/CreateWalletModal/CreateWalletModal'
import { useWallets } from '../../hooks/useWallets'
import { useI18n } from '../../i18n/I18nContext'
import { api } from '../../lib/api'
import type { WalletSummary } from '../../types/WalletSummary'
import './Wallet.css'

export function Wallet() {
  const { wallets, setWallets, loading, error } = useWallets()
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addPositionWalletId, setAddPositionWalletId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const activeWalletId = selectedId ?? wallets[0]?.id ?? null
  const activeWallet = wallets.find(w => w.id === activeWalletId) ?? null

  function handleWalletUpdate(updated: WalletSummary) {
    setWallets(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  function handleWalletCreated(created: WalletSummary) {
    setWallets(prev => [...prev, created])
    setSelectedId(created.id)
    setShowCreateModal(false)
  }

  async function handleDeleteWallet(walletId: string) {
    await api.delete(`/api/wallets/${walletId}`)
    setWallets(prev => {
      const next = prev.filter(w => w.id !== walletId)
      if (selectedId === walletId) setSelectedId(next[0]?.id ?? null)
      return next
    })
    setDeletingId(null)
  }

  if (loading) return (
    <div className="wallet-page">
      <Header />
      <div className="wallet-skeleton">
        <div className="skeleton-tabs" />
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

      <div className="wallet-nav-row">
        <div className="wallet-tabs">
          {wallets.map(w => (
            <button
              key={w.id}
              className={`wallet-tab ${w.id === activeWalletId ? 'wallet-tab--active' : ''}`}
              onClick={() => setSelectedId(w.id)}
            >
              {w.name}
            </button>
          ))}
        </div>
        <button className="wallet-new-btn" onClick={() => setShowCreateModal(true)}>
          {t.wallet.newWallet}
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="wallet-empty">
          <p className="wallet-empty-text">{t.wallet.noWallets}</p>
          <button className="wallet-empty-btn" onClick={() => setShowCreateModal(true)}>
            {t.wallet.createFirst}
          </button>
        </div>
      ) : activeWallet && (
        <div className="wallet-section">
          <div className="wallet-section-header">
            <button
              className="wallet-delete-btn"
              onClick={() => setDeletingId(activeWallet.id)}
            >
              {t.wallet.deleteWallet}
            </button>
          </div>
          <WalletCard
            wallet={activeWallet}
            index={0}
            onAddPosition={() => setAddPositionWalletId(activeWallet.id)}
            onWalletUpdate={handleWalletUpdate}
          />
          <PositionTable
            walletId={activeWallet.id}
            positions={activeWallet.positions}
            onWalletUpdate={handleWalletUpdate}
          />
        </div>
      )}

      {deletingId && (() => {
        const name = wallets.find(w => w.id === deletingId)?.name ?? ''
        return (
          <div className="modal-backdrop" onClick={() => setDeletingId(null)}>
            <div className="modal modal--confirm" onClick={e => e.stopPropagation()}>
              <div className="modal-title">{t.confirm.deleteWallet}</div>
              <p className="confirm-text">{t.confirm.deleteWalletText(name)}</p>
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setDeletingId(null)}>
                  {t.confirm.cancel}
                </button>
                <button className="modal-btn-danger" onClick={() => handleDeleteWallet(deletingId)}>
                  {t.confirm.delete}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {showCreateModal && (
        <CreateWalletModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleWalletCreated}
        />
      )}

      {addPositionWalletId && activeWallet && (
        <AddPositionModal
          walletId={activeWallet.id}
          walletName={activeWallet.name}
          onClose={() => setAddPositionWalletId(null)}
          onSuccess={updated => { handleWalletUpdate(updated); setAddPositionWalletId(null) }}
        />
      )}
    </div>
  )
}
