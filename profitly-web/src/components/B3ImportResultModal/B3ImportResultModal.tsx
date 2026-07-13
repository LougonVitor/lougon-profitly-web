import type { B3ImportResult } from '../../types/WalletSummary'
import '../AddPositionModal/AddPositionModal.css'

interface B3ImportResultModalProps {
  result: B3ImportResult
  /** Shown as the modal subtitle — e.g. "Resumo do extrato da B3" or "Carteira reintegrada". */
  subtitle?: string
  onDone: () => void
}

/**
 * Shared result screen for both the initial B3 import (wallet creation) and the
 * reintegration of an existing B3 wallet. Makes the dedup outcome explicit: what
 * was added versus what was recognised as already imported and skipped.
 */
export function B3ImportResultModal({ result, subtitle, onDone }: B3ImportResultModalProps) {
  const skippedEntries = Object.entries(result.skippedByType)
  return (
    <div className="modal-backdrop" onClick={onDone}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Importação concluída</div>
            <div className="modal-subtitle">{subtitle ?? 'Resumo do extrato da B3'}</div>
          </div>
          <button className="modal-close" onClick={onDone}>✕</button>
        </div>

        <div className="modal-form">
          <div className="modal-total">
            <span className="modal-total-label">Lançamentos importados</span>
            <span className="modal-total-value">{result.imported}</span>
          </div>

          {result.duplicates > 0 && (
            <div className="modal-field">
              <label className="modal-label">Já estavam na carteira ({result.duplicates})</label>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Estas movimentações já haviam sido importadas antes e foram ignoradas — nada
                foi duplicado. Só entram lançamentos que ainda não existiam na carteira.
              </div>
            </div>
          )}

          {skippedEntries.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">Movimentações não importadas ({result.skipped})</label>
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

          {result.errors.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">Itens com erro ({result.errors.length})</label>
              <ul style={{ margin: 0, paddingLeft: '1.2em', fontSize: 13, color: 'var(--text-down)' }}>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="modal-actions">
            <div />
            <button type="button" className="modal-btn-submit" onClick={onDone}>
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
