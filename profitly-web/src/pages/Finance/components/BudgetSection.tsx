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
  onEditBudget: (row: BudgetRow) => void
  onDeleteBudget: (type: ExpenseType) => void
}

export function BudgetSection({
  rows, view, onViewChange, showForm, onToggleForm,
  formType, onFormTypeChange, formValue, onFormValueChange, onSubmit,
  onEditBudget, onDeleteBudget,
}: BudgetSectionProps) {
  const budgeted = rows.filter(r => r.budget > 0)

  return (
    <div className="fin-budget-section fin-animate-in">
      <div className="fin-table-header">
        <h3 className="fin-section-title">
          Orçamento por categoria
          <HelpTip inline text="O orçamento é o teto que você define para gastar na categoria no mês. A tela já mostra quanto sobrou e o status, para você não precisar fazer contas." />
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
            {showForm ? 'Fechar' : 'Definir orçamento'}
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
        <BudgetTable rows={rows} onEditBudget={onEditBudget} onDeleteBudget={onDeleteBudget} />
      ) : (
        <BudgetChart rows={rows} />
      )}

      {view === 'list' && rows.length > 0 && budgeted.length === 0 && (
        <p className="fin-budget-note">
          Nenhuma categoria tem orçamento ainda — os valores acima são só o que já foi gasto.
        </p>
      )}
    </div>
  )
}

function BudgetTable({ rows, onEditBudget, onDeleteBudget }: {
  rows: BudgetRow[]
  onEditBudget: (row: BudgetRow) => void
  onDeleteBudget: (type: ExpenseType) => void
}) {
  return (
    <div className="fin-table-wrap">
      <table className="fin-table fin-budget-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Orçamento
              <HelpTip inline text="Quanto você planejou gastar nesta categoria no mês." />
            </th>
            <th>Gasto atual
              <HelpTip inline text="Soma do que já saiu nos lançamentos desta categoria." />
            </th>
            <th>Disponível
              <HelpTip inline text="Orçamento menos o gasto atual. Negativo significa que você passou do planejado." />
            </th>
            <th className="fin-budget-progress-col">Progresso</th>
            <th className="fin-th--center">Status
              <HelpTip inline text="No orçamento = até 80% do planejado, ou exatamente 100%. Atenção = de 80% a 99%, quando ainda dá para estourar. Acima do orçamento = passou do planejado." />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.type} className={`fin-row fin-budget-row fin-budget-row--${r.state} fin-animate-row`}>
              <td className="fin-cell-title">
                <span className="fin-budget-icon" style={{ background: r.color + '22', color: r.color }}>
                  {TYPE_ICONS[r.type]}
                </span>
                <span className="fin-budget-names">
                  <span className="fin-budget-name">{r.name}</span>
                  <span className="fin-budget-hint">{TYPE_HINTS[r.type]}</span>
                </span>
              </td>
              <td>{r.budget > 0 ? fmtBRL(r.budget) : <span className="fin-budget-unset">—</span>}</td>
              <td>{fmtBRL(r.spent)}</td>
              <td className={r.available < 0 ? 'fin-budget-negative' : 'fin-budget-available'}>
                {r.budget > 0 ? fmtBRL(r.available) : <span className="fin-budget-unset">—</span>}
              </td>
              <td className="fin-budget-progress-col">
                {r.pct == null ? (
                  <span className="fin-budget-unset">sem orçamento</span>
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
              <td className="fin-td--center">
                {r.pct == null ? (
                  <span className="fin-budget-unset">—</span>
                ) : (
                  <span className={`fin-budget-badge fin-budget-badge--${r.state}`}>
                    {BUDGET_STATE_LABELS[r.state]}
                  </span>
                )}
              </td>
              <td className="fin-budget-actions">
                <button
                  className="fin-icon-btn"
                  onClick={() => onEditBudget(r)}
                  title={r.budget > 0 ? 'Editar orçamento' : 'Definir orçamento'}
                >✎</button>
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
    </div>
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
