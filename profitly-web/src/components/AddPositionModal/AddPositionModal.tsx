import { useState, useEffect } from 'react'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import { useStockQuotes } from '../../hooks/useStockQuotes'
import { TickerSelect } from '../TickerSelect/TickerSelect'
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
  const { addEntry, loading, error } = usePositionEntries()

  const [ticker, setTicker] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
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
    if (!ticker || !date || quantity <= 0 || price <= 0) return
    const updated = await addEntry(walletId, ticker, { date, quantity, paidPrice: price })
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
            <TickerSelect stocks={stocks} value={ticker} onChange={setTicker} />
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
            <button type="submit" className="modal-btn-submit" disabled={loading || !ticker}>
              {loading ? 'Adding...' : '+ Add entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
