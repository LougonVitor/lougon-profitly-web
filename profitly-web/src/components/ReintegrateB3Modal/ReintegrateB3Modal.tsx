import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { WalletSummary, B3ImportResult } from '../../types/WalletSummary'
import { B3ImportResultModal } from '../B3ImportResultModal/B3ImportResultModal'
import '../AddPositionModal/AddPositionModal.css'

interface ReintegrateB3ModalProps {
  walletId: string
  walletName: string
  onClose: () => void
  /** Called with the refreshed wallet after the user closes the result screen. */
  onSuccess: (updated: WalletSummary) => void
}

/**
 * Reintegrates an existing B3 wallet with a newer "Movimentação" statement. The import
 * endpoint is idempotent (dedups by ticker/date/quantity/price/type), so uploading the
 * full history again, or only the new months, or a mix, all converge to the same result:
 * only the trades not already in the wallet are added.
 */
export function ReintegrateB3Modal({ walletId, walletName, onClose, onSuccess }: ReintegrateB3ModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<B3ImportResult | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<B3ImportResult>(
        `/api/wallets/${walletId}/import/b3`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setResult(res.data)
    } catch {
      setError('Falha ao importar o arquivo da B3. A carteira não foi alterada.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDone() {
    try {
      const res = await api.get<WalletSummary>(`/api/wallets/${walletId}`)
      onSuccess(res.data)
    } catch {
      onClose()
    }
  }

  if (result) {
    return <B3ImportResultModal result={result} subtitle="Carteira reintegrada" onDone={handleDone} />
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Reintegrar da B3</div>
            <div className="modal-subtitle">{walletName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-b3-help">
            <div className="modal-b3-help-title">Como funciona a reintegração</div>
            <p>
              Envie um novo <strong>extrato de Movimentação</strong> da B3. Comparamos cada
              movimentação com o que já está na carteira e <strong>adicionamos apenas as que
              faltam</strong>.
            </p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Pode reenviar <strong>todo o histórico</strong> — nada é duplicado, o que já existe é ignorado.</li>
              <li>Pode enviar só os <strong>meses novos</strong> — os lançamentos antigos são mantidos.</li>
              <li>Pode misturar antigos e novos — identificamos as duplicatas e lançamos só o que falta.</li>
            </ul>
            <p>
              Suas posições atuais <strong>não são apagadas</strong>. Lançamentos que você
              adicionou ou corrigiu à mão não são tocados.
            </p>
          </div>

          <div className="modal-field">
            <label className="modal-label">Extrato de Movimentação (.xlsx)</label>
            <input
              className="modal-input"
              type="file"
              accept=".xlsx"
              required
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading || !file}>
              {loading ? 'Reintegrando...' : 'Reintegrar carteira'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
