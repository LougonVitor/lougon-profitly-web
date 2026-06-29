import { useState, useEffect } from 'react'
import { useAddPosition } from '../../hooks/useAddPosition'
import { useStockQuotes } from '../../hooks/useStockQuotes'
import type { WalletSummary } from '../../types/WalletSummary'
import './AddPositionModal.css'

interface AddPositionModalProps {
  walletId: string
  walletName: string
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

export function AddPositionModal({ walletId, walletName, onClose, onSuccess }: AddPositionModalProps) {
  const { stocks } = useStockQuotes()
  const { addPosition, loading, error } = useAddPosition()

  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)

  const total = quantity * price

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker || quantity <= 0 || price <= 0) return

    const updated = await addPosition(walletId, {
      ticker,
      quantity,
      averagePrice: price,
    })

    if (updated) onSuccess(updated)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Add position</div>
            <div className="modal-subtitle">{walletName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Ticker</label>
            <select
              className="modal-select"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              required
            >
              <option value="">Select a stock...</option>
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.longName}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Quantity</label>
              <input
                className="modal-input"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Price (R$)</label>
              <input
                className="modal-input"
                type="number"
                min={0.01}
                step={0.01}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="modal-total">
            <span className="modal-total-label">Total value</span>
            <span className="modal-total-value">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? 'Adding...' : '+ Add position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
