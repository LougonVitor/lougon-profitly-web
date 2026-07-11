import type { Dispatch, SetStateAction, FormEvent } from 'react'
import type { ExpenseType, RecurringExpense, RecurringIncome } from '../types'
import { TYPE_LABELS, TYPE_COLORS, ALL_TYPES } from '../constants'
import { fmtBRL } from '../helpers'

interface RecurringTabProps {
  recurringList: RecurringExpense[]
  recurringIncomeList: RecurringIncome[]
  // Recurring expense form
  showAddRecurring: boolean
  onToggleRecurringForm: () => void
  editingRecurringId: number | null
  onStartEditRecurring: (r: RecurringExpense) => void
  recTitle: string; setRecTitle: Dispatch<SetStateAction<string>>
  recEstimated: string; setRecEstimated: Dispatch<SetStateAction<string>>
  recType: ExpenseType; setRecType: Dispatch<SetStateAction<ExpenseType>>
  recDueDay: string; setRecDueDay: Dispatch<SetStateAction<string>>
  recVariable: boolean; setRecVariable: Dispatch<SetStateAction<boolean>>
  onAddRecurring: (e: FormEvent) => void
  onDeleteRecurring: (id: number) => void
  // Recurring income form
  showAddRecIncome: boolean; onToggleRecIncomeForm: () => void
  editingRecIncomeId: number | null
  onStartEditRecIncome: (r: RecurringIncome) => void
  recIncDesc: string; setRecIncDesc: Dispatch<SetStateAction<string>>
  recIncAmount: string; setRecIncAmount: Dispatch<SetStateAction<string>>
  recIncDueDay: string; setRecIncDueDay: Dispatch<SetStateAction<string>>
  onAddRecIncome: (e: FormEvent) => void
  onDeleteRecIncome: (id: number) => void
}

export function RecurringTab({
  recurringList, recurringIncomeList,
  showAddRecurring, onToggleRecurringForm, editingRecurringId, onStartEditRecurring,
  recTitle, setRecTitle, recEstimated, setRecEstimated, recType, setRecType,
  recDueDay, setRecDueDay, recVariable, setRecVariable,
  onAddRecurring, onDeleteRecurring,
  showAddRecIncome, onToggleRecIncomeForm, editingRecIncomeId, onStartEditRecIncome,
  recIncDesc, setRecIncDesc, recIncAmount, setRecIncAmount, recIncDueDay, setRecIncDueDay,
  onAddRecIncome, onDeleteRecIncome,
}: RecurringTabProps) {
  return (
    <div className="fin-recurring fin-animate-in">
      <div className="fin-table-header">
        <h3 className="fin-section-title">Gastos Recorrentes</h3>
        <button className="fin-link-btn" onClick={onToggleRecurringForm}>
          {showAddRecurring ? '✕ fechar' : '+ novo recorrente'}
        </button>
      </div>
      <p className="fin-recurring-desc">
        Gastos configurados aqui são adicionados automaticamente a cada período.
      </p>

      {showAddRecurring && (
        <form className="fin-add-form fin-animate-in" onSubmit={onAddRecurring}>
          {editingRecurringId != null && (
            <p className="fin-recurring-desc" style={{margin:'0 0 0.75rem'}}>
              Editando um recorrente — as mudanças valem para os próximos períodos.
            </p>
          )}
          <div className="fin-add-row-simple">
            <input className="fin-input" placeholder="Título (ex: Aluguel)" value={recTitle}
              onChange={e=>setRecTitle(e.target.value)} required />
            <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor esperado (R$)"
              value={recEstimated} onChange={e=>setRecEstimated(e.target.value)} disabled={recVariable} />
            <select className="fin-input fin-input--short" value={recType}
              onChange={e=>setRecType(e.target.value as ExpenseType)}>
              {ALL_TYPES.filter(t=>t!=='INVESTMENT').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input className="fin-input fin-input--tiny" type="number" min="1" max="31" placeholder="Dia venc."
              value={recDueDay} onChange={e=>setRecDueDay(e.target.value)} title="Dia do vencimento (1-31)" />
            <label className="fin-check">
              <input type="checkbox" checked={recVariable}
                onChange={e=>setRecVariable(e.target.checked)} /> Valor variável
            </label>
            <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">
              {editingRecurringId != null ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}

      {recurringList.length === 0 ? (
        <div className="fin-empty-state">
          <span>↻</span>
          <p>Nenhum gasto recorrente configurado.<br/>Adicione gastos que se repetem todo mês, como aluguel, assinaturas e plano de saúde.</p>
        </div>
      ) : (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Valor esperado</th>
                <th>Tipo</th>
                <th className="fin-th--center">Vencimento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recurringList.map(r => (
                <tr key={r.id} className="fin-row fin-row--recurring fin-animate-row">
                  <td className="fin-cell-title">
                    {r.title}
                    {r.variable && <span className="fin-var-badge" title="Valor varia a cada mês">variável</span>}
                  </td>
                  <td>{r.variable ? <span className="fin-muted">variável</span> : fmtBRL(r.estimatedValue)}</td>
                  <td>
                    <span className="fin-type-badge"
                      style={{background:TYPE_COLORS[r.type]+'22', color:TYPE_COLORS[r.type]}}>
                      {TYPE_LABELS[r.type]}
                    </span>
                  </td>
                  <td className="fin-td--center">{r.dueDay ? `dia ${r.dueDay}` : '—'}</td>
                  <td>
                    <div className="fin-row-actions">
                      <button
                        className={`fin-edit-btn ${editingRecurringId === r.id ? 'fin-edit-btn--active' : ''}`}
                        onClick={()=>onStartEditRecurring(r)} title="Editar"
                      >✎</button>
                      <button className="fin-del-btn" onClick={()=>onDeleteRecurring(r.id)} title="Remover">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Recurring incomes ── */}
      <div className="fin-table-header" style={{marginTop:'2rem'}}>
        <h3 className="fin-section-title">Rendas Recorrentes</h3>
        <button className="fin-link-btn" onClick={onToggleRecIncomeForm}>
          {showAddRecIncome ? '✕ fechar' : '+ nova renda recorrente'}
        </button>
      </div>
      <p className="fin-recurring-desc">
        Rendas configuradas aqui são adicionadas automaticamente às entradas de cada período.
      </p>

      {showAddRecIncome && (
        <form className="fin-add-form fin-animate-in" onSubmit={onAddRecIncome}>
          {editingRecIncomeId != null && (
            <p className="fin-recurring-desc" style={{margin:'0 0 0.75rem'}}>
              Editando uma renda recorrente — as mudanças valem para os próximos períodos.
            </p>
          )}
          <div className="fin-add-row-simple">
            <input className="fin-input" placeholder="Descrição (ex: Aluguel recebido)" value={recIncDesc}
              onChange={e=>setRecIncDesc(e.target.value)} required />
            <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor (R$)"
              value={recIncAmount} onChange={e=>setRecIncAmount(e.target.value)} required />
            <input className="fin-input fin-input--tiny" type="number" min="1" max="31" placeholder="Dia"
              value={recIncDueDay} onChange={e=>setRecIncDueDay(e.target.value)} title="Dia do recebimento (1-31)" />
            <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">
              {editingRecIncomeId != null ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}

      {recurringIncomeList.length === 0 ? (
        <div className="fin-empty-state">
          <span>💰</span>
          <p>Nenhuma renda recorrente configurada.<br/>Adicione entradas que se repetem, como salário extra, aluguel recebido ou mesada.</p>
        </div>
      ) : (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th className="fin-th--center">Recebimento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recurringIncomeList.map(r => (
                <tr key={r.id} className="fin-row fin-row--recurring fin-animate-row">
                  <td className="fin-cell-title">{r.description}</td>
                  <td>{fmtBRL(r.amount)}</td>
                  <td className="fin-td--center">{r.dueDay ? `dia ${r.dueDay}` : '—'}</td>
                  <td>
                    <div className="fin-row-actions">
                      <button
                        className={`fin-edit-btn ${editingRecIncomeId === r.id ? 'fin-edit-btn--active' : ''}`}
                        onClick={()=>onStartEditRecIncome(r)} title="Editar"
                      >✎</button>
                      <button className="fin-del-btn" onClick={()=>onDeleteRecIncome(r.id)} title="Remover">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
