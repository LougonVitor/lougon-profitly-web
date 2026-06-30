import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { WalletSummary } from '../../types/WalletSummary'
import '../AddPositionModal/AddPositionModal.css'

interface CreateWalletModalProps {
  onClose: () => void
  onSuccess: (created: WalletSummary) => void
}

export function CreateWalletModal({ onClose, onSuccess }: CreateWalletModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<WalletSummary>('/api/wallets', { name })
      onSuccess(res.data)
    } catch {
      setError('Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">New wallet</div>
            <div className="modal-subtitle">Give it a name to get started</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Wallet name</label>
            <input
              className="modal-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. My Portfolio"
              required
              autoFocus
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? 'Creating...' : '+ Create wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
