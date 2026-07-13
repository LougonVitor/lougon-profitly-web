import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { WalletSummary } from '../../types/WalletSummary'
import '../AddPositionModal/AddPositionModal.css'

interface CreateWalletModalProps {
  onClose: () => void
  onSuccess: (created: WalletSummary) => void
}

interface B3ImportResult {
  imported: number
  skipped: number
  skippedByType: Record<string, number>
  errors: string[]
}

type Mode = 'choose' | 'blank' | 'b3'

export function CreateWalletModal({ onClose, onSuccess }: CreateWalletModalProps) {
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<B3ImportResult | null>(null)
  const [createdWallet, setCreatedWallet] = useState<WalletSummary | null>(null)

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

    if (mode === 'b3' && file) {
      let created: WalletSummary | null = null
      try {
        created = (await api.post<WalletSummary>('/api/wallets', { name })).data
        const formData = new FormData()
        formData.append('file', file)
        const importRes = await api.post<B3ImportResult>(
          `/api/wallets/${created.id}/import/b3`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        setCreatedWallet(created)
        setImportResult(importRes.data)
      } catch {
        // Roll back so a failed import never leaves an empty orphan wallet behind.
        if (created) {
          try {
            await api.delete(`/api/wallets/${created.id}`)
          } catch {
            // best-effort cleanup — surface the original import error either way
          }
        }
        setError('Falha ao importar o arquivo da B3. Nenhuma carteira foi criada.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await api.post<WalletSummary>('/api/wallets', { name })
      onSuccess(res.data)
    } catch {
      setError('Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  function handleDone() {
    if (createdWallet) onSuccess(createdWallet)
  }

  if (importResult) {
    const skippedEntries = Object.entries(importResult.skippedByType)
    return (
      <div className="modal-backdrop" onClick={handleDone}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-title">Importação concluída</div>
              <div className="modal-subtitle">Resumo do extrato da B3</div>
            </div>
            <button className="modal-close" onClick={handleDone}>✕</button>
          </div>

          <div className="modal-form">
            <div className="modal-total">
              <span className="modal-total-label">Posições importadas</span>
              <span className="modal-total-value">{importResult.imported}</span>
            </div>

            {skippedEntries.length > 0 && (
              <div className="modal-field">
                <label className="modal-label">Movimentações não importadas ({importResult.skipped})</label>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Proventos e renda fixa não são importados automaticamente — adicione manualmente se precisar.
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2em', fontSize: 13, color: 'var(--text-muted)' }}>
                  {skippedEntries.map(([type, count]) => (
                    <li key={type}>{type}: {count}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="modal-field">
                <label className="modal-label">Itens com erro ({importResult.errors.length})</label>
                <ul style={{ margin: 0, paddingLeft: '1.2em', fontSize: 13, color: 'var(--text-down)' }}>
                  {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <div />
              <button type="button" className="modal-btn-submit" onClick={handleDone}>
                Concluir
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'choose') {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-title">Nova carteira</div>
              <div className="modal-subtitle">Como você quer começar?</div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="modal-form">
            <button
              type="button"
              className="modal-input"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setMode('blank')}
            >
              <strong>Carteira em branco</strong>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Comece do zero e lance suas posições manualmente
              </div>
            </button>

            <button
              type="button"
              className="modal-input"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setMode('b3')}
            >
              <strong>Importar da B3</strong>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Envie o extrato de Movimentação baixado em investidor.b3.com.br
              </div>
            </button>

            <div className="modal-actions">
              <button type="button" className="modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <div />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{mode === 'b3' ? 'Importar da B3' : 'New wallet'}</div>
            <div className="modal-subtitle">
              {mode === 'b3' ? 'Dê um nome e envie o arquivo .xlsx' : 'Give it a name to get started'}
            </div>
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

          {mode === 'b3' && (
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
          )}

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={() => setMode('choose')}>
              Back
            </button>
            <button type="submit" className="modal-btn-submit" disabled={loading || (mode === 'b3' && !file)}>
              {loading ? 'Creating...' : '+ Create wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
