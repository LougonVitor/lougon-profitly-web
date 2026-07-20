import type { Dispatch, SetStateAction, FormEvent } from 'react'
import type { ExpenseType } from '../types'
import { TYPE_LABELS, TYPE_COLORS, ALL_TYPES } from '../constants'

interface AddExpenseModalProps {
  addTitle: string; setAddTitle: Dispatch<SetStateAction<string>>
  addReal: string; setAddReal: Dispatch<SetStateAction<string>>
  addType: ExpenseType; setAddType: Dispatch<SetStateAction<ExpenseType>>
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}

export function AddExpenseModal({
  addTitle, setAddTitle, addReal, setAddReal, addType, setAddType, onSubmit, onClose,
}: AddExpenseModalProps) {
  return (
    <div className="fin-modal-overlay" onClick={onClose}>
      <div className="fin-modal fin-modal--form fin-animate-in" onClick={e => e.stopPropagation()}>
        <button className="fin-modal-close" onClick={onClose} type="button" aria-label="Fechar">✕</button>
        <div className="fin-modal-icon">💸</div>
        <h3 className="fin-modal-title">Novo gasto</h3>
        <p className="fin-modal-body">
          Registre um gasto avulso neste período — ele entra direto na lista de Lançamentos.
        </p>

        <form className="fin-modal-form" onSubmit={onSubmit}>
          <div className="fin-field">
            <label>Título</label>
            <input
              className="fin-input"
              placeholder="Ex: Supermercado"
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="fin-modal-row-two">
            <div className="fin-field">
              <label>Valor (R$)</label>
              <input
                className="fin-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={addReal}
                onChange={e => setAddReal(e.target.value)}
                required
              />
            </div>
            <div className="fin-field">
              <label>Categoria</label>
              <select
                className="fin-input fin-modal-select"
                value={addType}
                onChange={e => setAddType(e.target.value as ExpenseType)}
              >
                {ALL_TYPES.filter(t => t !== 'INVESTMENT').map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fin-modal-type-preview">
            <span className="fin-type-badge" style={{ background: TYPE_COLORS[addType] + '22', color: TYPE_COLORS[addType] }}>
              {TYPE_LABELS[addType]}
            </span>
            <span className="fin-modal-type-preview-hint">categoria selecionada</span>
          </div>

          <div className="fin-modal-footer">
            <button type="button" className="fin-btn fin-btn--ghost fin-btn--sm" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="fin-btn fin-btn--primary fin-btn--sm" disabled={!addTitle || !addReal}>
              Adicionar gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
