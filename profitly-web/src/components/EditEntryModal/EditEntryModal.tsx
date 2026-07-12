import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PositionEntry, WalletSummary } from '../../types/WalletSummary'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import './EditEntryModal.css'

interface EditEntryModalProps {
  walletId: string
  ticker: string
  entry: PositionEntry
  isFixedIncome?: boolean
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

export function EditEntryModal({ walletId, ticker, entry, isFixedIncome, onClose, onSuccess }: EditEntryModalProps) {
  const { updateEntry, loading, error } = usePositionEntries()

  const [date, setDate] = useState(entry.date)
  const [quantity, setQuantity] = useState(String(entry.quantity))
  const [price, setPrice] = useState(String(entry.paidPrice))
  const [entryType, setEntryType] = useState<'BUY' | 'SELL'>(entry.type ?? 'BUY')

  const priceValue = parseFloat(price.replace(',', '.')) || 0
  const quantityValue = parseFloat(quantity.replace(',', '.')) || 0
  const total = quantityValue * priceValue

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (quantityValue <= 0 || priceValue <= 0) return
    const updated = await updateEntry(walletId, ticker, entry.id, { date, quantity: quantityValue, paidPrice: priceValue, type: entryType })
    if (updated) onSuccess(updated)
  }

  // Portal: this modal is triggered from inside a <table>, where a div is invalid
  // and gets clipped by the table layout — render on document.body instead.
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Editar lançamento</div>
            <div className="modal-subtitle">{ticker}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {!isFixedIncome && (
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
          )}

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Data</label>
              <input
                className="modal-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Quantidade</label>
              <input
                className="modal-input"
                type="text"
                inputMode="decimal"
                placeholder="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value.replace(/[^\d.,]/g, ''))}
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Preço pago (R$)</label>
              <input
                className="modal-input"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={price}
                onChange={e => setPrice(e.target.value.replace(/[^\d.,]/g, ''))}
                disabled={isFixedIncome}
                required
              />
            </div>
          </div>

          <div className="modal-total">
            <span className="modal-total-label">{entryType === 'SELL' ? 'Total da venda' : 'Total investido'}</span>
            <span className="modal-total-value">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
