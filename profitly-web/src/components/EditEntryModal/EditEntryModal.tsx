import { useState, useEffect } from 'react'
import type { PositionEntry, WalletSummary } from '../../types/WalletSummary'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import './EditEntryModal.css'

interface EditEntryModalProps {
  walletId: string
  ticker: string
  entry: PositionEntry
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

export function EditEntryModal({ walletId, ticker, entry, onClose, onSuccess }: EditEntryModalProps) {
  const { updateEntry, loading, error } = usePositionEntries()

  const [date, setDate] = useState(entry.date)
  const [quantity, setQuantity] = useState(entry.quantity)
  const [price, setPrice] = useState(entry.paidPrice)
  const [entryType, setEntryType] = useState<'BUY' | 'SELL'>(entry.type ?? 'BUY')

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
    const updated = await updateEntry(walletId, ticker, entry.id, { date, quantity, paidPrice: price, type: entryType })
    if (updated) onSuccess(updated)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit entry</div>
            <div className="modal-subtitle">{ticker}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Tipo</label>
            <select
              className="modal-input"
              value={entryType}
              onChange={e => setEntryType(e.target.value as 'BUY' | 'SELL')}
            >
              <option value="BUY">Compra</option>
              <option value="SELL">Venda</option>
            </select>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Date</label>
              <input
                className="modal-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

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
              <label className="modal-label">Paid price (R$)</label>
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
            <span className="modal-total-label">Total invested</span>
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
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
