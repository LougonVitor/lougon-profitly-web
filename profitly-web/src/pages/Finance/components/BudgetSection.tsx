import type { FormEvent } from 'react'
import type { BudgetRow, ExpenseType } from '../types'
import {
  TYPE_LABELS, TYPE_ICONS, TYPE_HINTS, TYPE_COLORS, ALL_TYPES, BUDGET_STATE_LABELS,
} from '../constants'
import { fmtBRL, fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

export type BudgetView = 'list'|'chart'

interface BudgetSectionProps {
  rows: BudgetRow[]
  view: BudgetView
  onViewChange: (v: BudgetView) => void
  showForm: boolean
  onToggleForm: () => void
  formType: ExpenseType
  onFormTypeChange: (t: ExpenseType) => void
  formValue: string
  onFormValueChange: (v: string) => void
  onSubmit: (e: FormEvent) => void
  onDeleteBudget: (type: ExpenseType) => void
  // Edição do orçamento direto na célula
  editingType: ExpenseType | null
  editValue: string
  onStartEdit: (row: BudgetRow) => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
}

export function BudgetSection({
  rows, view, onViewChange, showForm, onToggleForm,
  formType, onFormTypeChange, formValue, onFormValueChange, onSubmit, onDeleteBudget,
  editingType, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
}: BudgetSectionProps) {
  const budgeted = rows.filter(r => r.budget > 0)

  return (
    <div className="fin-budget-section fin-animate-in">
      <div className="fin-table-header">
        <h3 className="fin-section-title">
          Orçamento por categoria
          <HelpTip inline text="O orçamento é o teto que você define para gastar na categoria no mês. Clique no valor da coluna Orçamento para alterá-lo." />
        </h3>
        <div className="fin-header-actions">
          <div className="fin-view-toggle" role="group" aria-label="Forma de visualização">
            <button
              type="button"
              className={`fin-view-btn ${view === 'list' ? 'fin-view-btn--active' : ''}`}
              onClick={() => onViewChange('list')}
              aria-pressed={view === 'list'}
            >☰ Lista</button>
            <button
              type="button"
              className={`fin-view-btn ${view === 'chart' ? 'fin-view-btn--active' : ''}`}
              onClick={() => onViewChange('chart')}
              aria-pressed={view === 'chart'}
            >📊 Gráfico</button>
          </div>
          <button className={`fin-btn--add ${showForm ? 'fin-btn--add--active' : ''}`} onClick={onToggleForm}>
            <span className="fin-btn--add-icon">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Fechar' : 'Nova categoria'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="fin-mini-form fin-animate-in" onSubmit={onSubmit}>
          <select
            className="fin-input fin-input--short"
            value={formType}
            onChange={e => onFormTypeChange(e.target.value as ExpenseType)}
          >
            {ALL_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input
            className="fin-input fin-input--short"
            type="number" step="0.01" min="0"
            placeholder="Orçamento mensal (R$)"
            value={formValue}
            onChange={e => onFormValueChange(e.target.value)}
            required
          />
          <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Salvar</button>
        </form>
      )}

      {rows.length === 0 ? (
        <p className="fin-recurring-desc">
          Defina um orçamento por categoria para acompanhar quanto ainda pode gastar e receber alertas antes de estourar.
        </p>
      ) : view === 'list' ? (
        <BudgetTable
          rows={rows}
          onDeleteBudget={onDeleteBudget}
          editingType={editingType}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
        />
      ) : (
        <BudgetChart rows={rows} />
      )}

      {view === 'list' && rows.length > 0 && budgeted.length === 0 && (
        <p className="fin-budget-note">
          Nenhuma categoria tem orçamento ainda — clique em um valor da coluna Orçamento para definir o primeiro.
        </p>
      )}
    </div>
  )
}

interface BudgetTableProps {
  rows: BudgetRow[]
  onDeleteBudget: (type: ExpenseType) => void
  editingType: ExpenseType | null
  editValue: string
  onStartEdit: (row: BudgetRow) => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
}

function BudgetTable({
  rows, onDeleteBudget, editingType, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
}: BudgetTableProps) {
  return (
    <table className="fin-table fin-budget-table">
      <thead>
        <tr>
          <th className="fin-bcol-cat">Categoria</th>
          <th className="fin-bcol-num">Orçamento
            <HelpTip inline text="Quanto você planejou gastar nesta categoria no mês. Clique no valor para alterar." />
          </th>
          <th className="fin-bcol-num">Gasto atual
            <HelpTip inline text="Soma do que já saiu nos lançamentos desta categoria." />
          </th>
          <th className="fin-bcol-num">Disponível
            <HelpTip inline text="Orçamento menos o gasto atual. Negativo significa que você passou do planejado." />
          </th>
          <th className="fin-bcol-prog">Progresso</th>
          <th className="fin-bcol-status">Status
            <HelpTip inline text="No orçamento = até 80% do planejado, ou exatamente 100%. Atenção = de 80% a 99%, quando ainda dá para estourar. Acima do orçamento = passou do planejado." />
          </th>
          <th className="fin-bcol-act"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.type} className={`fin-row fin-budget-row fin-budget-row--${r.state} fin-animate-row`}>
            <td className="fin-bcol-cat" data-label="Categoria">
              <div className="fin-budget-cat">
                <span className="fin-budget-icon" style={{ background: r.color + '22', color: r.color }}>
                  {TYPE_ICONS[r.type]}
                </span>
                <span className="fin-budget-names">
                  <span className="fin-budget-name">{r.name}</span>
                  <span className="fin-budget-hint">{TYPE_HINTS[r.type]}</span>
                </span>
              </div>
            </td>

            <td className="fin-bcol-num" data-label="Orçamento">
              {editingType === r.type ? (
                <input
                  className="fin-inline-input fin-inline-input--number"
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editValue}
                  onChange={e => onEditChange(e.target.value)}
                  onBlur={onCommitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit() }}
                />
              ) : (
                <span
                  className="fin-editable-cell fin-budget-budget"
                  onClick={() => onStartEdit(r)}
                  title="Clique para editar o orçamento"
                >
                  {r.budget > 0 ? fmtBRL(r.budget) : <span className="fin-budget-unset">definir</span>}
                </span>
              )}
            </td>

            <td className="fin-bcol-num" data-label="Gasto atual">{fmtBRL(r.spent)}</td>

            <td
              className={`fin-bcol-num ${r.available < 0 ? 'fin-budget-negative' : 'fin-budget-available'}`}
              data-label="Disponível"
            >
              {r.budget > 0 ? fmtBRL(r.available) : <span className="fin-budget-unset">—</span>}
            </td>

            <td className="fin-bcol-prog" data-label="Progresso">
              {r.pct == null ? (
                <span className="fin-budget-unset">—</span>
              ) : (
                <div className="fin-budget-progress">
                  <span className="fin-budget-pct">{fmtPct(r.pct)}</span>
                  <div className="fin-budget-track">
                    <div
                      className="fin-budget-fill"
                      style={{ width: `${Math.min(r.pct, 100)}%`, background: r.state === 'over' ? '#ef4444' : r.color }}
                    />
                  </div>
                </div>
              )}
            </td>

            <td className="fin-bcol-status" data-label="Status">
              {r.pct == null ? (
                <span className="fin-budget-unset">—</span>
              ) : (
                <span className={`fin-budget-badge fin-budget-badge--${r.state}`}>
                  {BUDGET_STATE_LABELS[r.state]}
                </span>
              )}
            </td>

            <td className="fin-bcol-act">
              {r.budget > 0 && (
                <button
                  className="fin-icon-btn fin-icon-btn--danger"
                  onClick={() => onDeleteBudget(r.type)}
                  title="Remover orçamento"
                >✕</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Comparativo orçamento × gasto por categoria, escalado pelo maior valor da tela. */
function BudgetChart({ rows }: { rows: BudgetRow[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.budget, r.spent), 0)
  if (max <= 0) return null

  return (
    <div className="fin-budget-chart">
      <div className="fin-budget-chart-legend">
        <span><i className="fin-swatch fin-swatch--budget" /> Orçamento</span>
        <span><i className="fin-swatch fin-swatch--spent" /> Gasto real</span>
      </div>
      <div className="fin-budget-chart-rows">
        {rows.map(r => (
          <div key={r.type} className="fin-budget-chart-row">
            <div className="fin-budget-chart-label">
              <span className="fin-cat-dot" style={{ background: r.color }} />
              {r.name}
            </div>
            <div className="fin-budget-chart-bars">
              <div className="fin-budget-chart-bar-wrap">
                <div className="fin-budget-chart-bar fin-budget-chart-bar--budget" style={{ width: `${(r.budget / max) * 100}%` }} />
                <span className="fin-budget-chart-val">{r.budget > 0 ? fmtBRL(r.budget) : '—'}</span>
              </div>
              <div className="fin-budget-chart-bar-wrap">
                <div
                  className="fin-budget-chart-bar fin-budget-chart-bar--spent"
                  style={{ width: `${(r.spent / max) * 100}%`, background: r.state === 'over' ? '#ef4444' : TYPE_COLORS[r.type] }}
                />
                <span className="fin-budget-chart-val">{fmtBRL(r.spent)}</span>
              </div>
            </div>
            <div className={`fin-budget-chart-pct fin-budget-chart-pct--${r.state}`}>
              {r.pct == null ? '—' : fmtPct(r.pct)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
