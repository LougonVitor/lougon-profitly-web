import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useFixedIncome } from '../../hooks/useFixedIncome'
import { useI18n } from '../../i18n/I18nContext'
import type { WalletSummary } from '../../types/WalletSummary'

interface RedeemModalProps {
  walletId: string
  ticker: string
  positionName: string
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

export function RedeemModal({ walletId, ticker, positionName, onClose, onSuccess }: RedeemModalProps) {
  const { redeemFixedIncome, loading, error } = useFixedIncome()
  const { t } = useI18n()
  const fi = t.fixedIncome

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))

  async function handleConfirm() {
    const updated = await redeemFixedIncome(walletId, ticker, date)
    if (updated) onSuccess(updated)
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--confirm" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{fi.redeemTitle}</div>
        <p className="confirm-text">{fi.redeemText(positionName)}</p>

        <div className="modal-field">
          <label className="modal-label">{fi.redeemDate}</label>
          <input
            className="modal-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose} disabled={loading}>
            {t.confirm.cancel}
          </button>
          <button className="modal-btn-submit" onClick={handleConfirm} disabled={loading}>
            {loading ? fi.redeeming : fi.redeem}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
