import { useState, useEffect, useMemo } from 'react'
import { usePositionEntries } from '../../hooks/usePositionEntries'
import { useTickers } from '../../hooks/useTickers'
import { api } from '../../lib/api'
import type { Ticker } from '../../types/Ticker'
import { TickerSelect } from '../TickerSelect/TickerSelect'
import { useI18n } from '../../i18n/I18nContext'
import type { WalletSummary } from '../../types/WalletSummary'
import './AddPositionModal.css'

interface AddPositionModalProps {
  walletId: string
  walletName: string
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

export function AddPositionModal({ walletId, walletName, onClose, onSuccess }: AddPositionModalProps) {
  const { tickers } = useTickers()
  const { addEntry, loading, error } = usePositionEntries()
  const { t } = useI18n()
  const [cryptoTickers, setCryptoTickers] = useState<Ticker[]>([])

  useEffect(() => {
    interface CryptoQuote { coin: string; coinName: string | null; imageUrl: string | null }
    api.get<CryptoQuote[]>('/api/crypto/quotes')
      .then(res => setCryptoTickers(res.data.map(q => ({
        symbol: q.coin,
        name: q.coinName ?? q.coin,
        longName: q.coinName ?? q.coin,
        logoUrl: q.imageUrl,
      } as Ticker))))
      .catch(() => setCryptoTickers([]))
  }, [])

  const allTickers = useMemo(() => {
    const known = new Set(tickers.map(tk => tk.symbol))
    return [...tickers, ...cryptoTickers.filter(c => !known.has(c.symbol))]
  }, [tickers, cryptoTickers])

  const [ticker, setTicker] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)
  const [entryType, setEntryType] = useState<'BUY' | 'SELL'>('BUY')

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
    const updated = await addEntry(walletId, ticker, { date, quantity, paidPrice: price, type: entryType })
    if (updated) onSuccess(updated)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{t.modal.addPosition}</div>
            <div className="modal-subtitle">{walletName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <div className="entry-type-toggle" role="radiogroup" aria-label="Tipo de operação">
              <button
                type="button"
                className={`entry-type-btn ${entryType === 'BUY' ? 'entry-type-btn--buy' : ''}`}
                onClick={() => setEntryType('BUY')}
              >
                Compra
              </button>
              <button
                type="button"
                className={`entry-type-btn ${entryType === 'SELL' ? 'entry-type-btn--sell' : ''}`}
                onClick={() => setEntryType('SELL')}
              >
                Venda
              </button>
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">{t.modal.ticker}</label>
            <TickerSelect tickers={allTickers} value={ticker} onChange={setTicker} />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">{t.modal.date}</label>
              <input
                className="modal-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">{t.modal.quantity}</label>
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
          </div>

          <div className="modal-field">
            <label className="modal-label">{t.modal.paidPrice}</label>
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

          <div className="modal-total">
            <span className="modal-total-label">{entryType === 'SELL' ? 'Total da venda' : t.modal.totalInvested}</span>
            <span className="modal-total-value">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              {t.modal.cancel}
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading || !ticker}>
              {loading ? t.modal.adding : t.modal.addEntry}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
