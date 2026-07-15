import type { Dispatch, SetStateAction, FormEvent, ChangeEvent, RefObject } from 'react'
import type { CurrentPeriod, Expense, ExpenseType, EditCell, EditField, BudgetRow } from '../types'
import { TYPE_LABELS, ALL_TYPES, STATUS_LABELS, INVEST_PCTS } from '../constants'
import { fmtBRL, fmtPct, buildBudgetRows, buildAlerts, pctOf, daysLeftInPeriod } from '../helpers'
import { KpiCard } from '../components/KpiCard'
import { AlertsPanel } from '../components/AlertsPanel'
import { BudgetSection, type BudgetView } from '../components/BudgetSection'
import { ExpenseRow } from '../components/ExpenseRow'
import { HelpTip } from '../components/HelpTip'

interface CurrentPeriodTabProps {
  period: CurrentPeriod
  // Salary
  editingSalary: boolean; setEditingSalary: Dispatch<SetStateAction<boolean>>
  salaryInput: string; setSalaryInput: Dispatch<SetStateAction<string>>
  salaryRef: RefObject<HTMLInputElement | null>
  onSaveSalary: () => void
  // Additional income
  showAddIncome: boolean; setShowAddIncome: Dispatch<SetStateAction<boolean>>
  incomeDesc: string; setIncomeDesc: Dispatch<SetStateAction<string>>
  incomeAmount: string; setIncomeAmount: Dispatch<SetStateAction<string>>
  onAddIncome: (e: FormEvent) => void
  onDeleteIncome: (id: number) => void
  // Budget per category (o antigo "limite de gastos")
  budgetView: BudgetView; setBudgetView: Dispatch<SetStateAction<BudgetView>>
  showAddLimit: boolean; onToggleLimitForm: () => void
  limitType: ExpenseType; setLimitType: Dispatch<SetStateAction<ExpenseType>>
  limitValue: string; setLimitValue: Dispatch<SetStateAction<string>>
  onSaveLimit: (e: FormEvent) => void
  onDeleteLimit: (type: ExpenseType) => void
  editingBudgetType: ExpenseType | null
  budgetEditVal: string
  onStartBudgetEdit: (row: BudgetRow) => void
  onBudgetEditChange: (v: string) => void
  onCommitBudgetEdit: () => void
  onCancelBudgetEdit: () => void
  // Savings target
  savingsTargetInput: string; setSavingsTargetInput: Dispatch<SetStateAction<string>>
  editingSavings: boolean; setEditingSavings: Dispatch<SetStateAction<boolean>>
  onSaveSavingsTarget: () => void
  // Add expense
  showAdd: boolean; setShowAdd: Dispatch<SetStateAction<boolean>>
  addTitle: string; setAddTitle: Dispatch<SetStateAction<string>>
  addReal: string; setAddReal: Dispatch<SetStateAction<string>>
  addType: ExpenseType; setAddType: Dispatch<SetStateAction<ExpenseType>>
  onAddExpense: (e: FormEvent) => void
  // CSV
  onExport: (url: string, filename: string) => void
  onImport: (e: ChangeEvent<HTMLInputElement>) => void
  // Inline editing / row actions
  editCell: EditCell | null
  editCellVal: string
  onStartEdit: (id: number, field: EditField, val: string) => void
  onEditChange: (v: string) => void
  onCommit: () => void
  onCancelEdit: () => void
  onMarkPaid: (exp: Expense) => void
  onDelete: (id: number) => void
  // Investment row
  investPct: number
  onInvestPct: (pct: number) => void
  investManual: string; setInvestManual: Dispatch<SetStateAction<string>>
  onInvestManual: () => void
  onSetInvestmentAuto: (auto: boolean) => void
}

export function CurrentPeriodTab({
  period,
  editingSalary, setEditingSalary, salaryInput, setSalaryInput, salaryRef, onSaveSalary,
  showAddIncome, setShowAddIncome, incomeDesc, setIncomeDesc, incomeAmount, setIncomeAmount,
  onAddIncome, onDeleteIncome,
  budgetView, setBudgetView,
  showAddLimit, onToggleLimitForm, limitType, setLimitType, limitValue, setLimitValue,
  onSaveLimit, onDeleteLimit,
  editingBudgetType, budgetEditVal, onStartBudgetEdit, onBudgetEditChange,
  onCommitBudgetEdit, onCancelBudgetEdit,
  savingsTargetInput, setSavingsTargetInput, editingSavings, setEditingSavings, onSaveSavingsTarget,
  showAdd, setShowAdd, addTitle, setAddTitle, addReal, setAddReal, addType, setAddType, onAddExpense,
  onExport, onImport,
  editCell, editCellVal, onStartEdit, onEditChange, onCommit, onCancelEdit, onMarkPaid, onDelete,
  investPct, onInvestPct, investManual, setInvestManual, onInvestManual, onSetInvestmentAuto,
}: CurrentPeriodTabProps) {
  const inv = period.expenses.find(e => e.type === 'INVESTMENT') ?? null
  const editingInvReal = inv != null && editCell?.id === inv.id && editCell.field === 'real'
  const nonInvestmentRecurring = period.expenses.filter(e => e.recurring && e.type !== 'INVESTMENT')
  const nonRecurring = period.expenses.filter(e => !e.recurring)

  // If investment has no estimatedValue yet, fall back to investmentTarget from settings
  const invEst = inv?.estimatedValue ?? period.investmentTarget ?? 0
  const extraInvDeduction = inv?.estimatedValue == null ? invEst : 0
  const saldoFinalEstimado = period.totalIncome - period.totalEstimated - extraInvDeduction

  const budgetRows = buildBudgetRows(period.expenses, period.budgetLimits)
  const alerts = buildAlerts(budgetRows)

  const savingsPct = period.savingsTarget && period.savingsTarget > 0
    ? (period.savedThisMonth / period.savingsTarget) * 100
    : null
  const daysLeft = daysLeftInPeriod(period.resetDay)

  return (
    <>
      {/* ── Income section ── */}
      <div className="fin-income-section fin-animate-in">
        <div className="fin-income-header">
          <h3 className="fin-section-title">Entradas do mês</h3>
          <button className={`fin-btn--add ${showAddIncome ? 'fin-btn--add--active' : ''}`} onClick={()=>setShowAddIncome(v=>!v)}>
            <span className="fin-btn--add-icon">{showAddIncome ? '✕' : '+'}</span>
            {showAddIncome ? 'Fechar' : 'Renda adicional'}
          </button>
        </div>

        <div className="fin-income-row">
          {/* Salary card */}
          <div className="fin-income-card fin-income-card--salary">
            <HelpTip text="O quanto você recebe por mês já com os descontos. É a base das suas entradas — clique no valor para editar." />
            <div className="fin-income-card-label">Salário Líquido</div>
            {editingSalary ? (
              <div className="fin-salary-edit">
                <span className="fin-salary-prefix">R$</span>
                <input
                  ref={salaryRef}
                  className="fin-salary-input"
                  type="number"
                  step="0.01"
                  value={salaryInput}
                  onChange={e=>setSalaryInput(e.target.value)}
                  onBlur={onSaveSalary}
                  onKeyDown={e=>{ if(e.key==='Enter') onSaveSalary(); if(e.key==='Escape') setEditingSalary(false) }}
                />
              </div>
            ) : (
              <button className="fin-income-value fin-income-value--editable" onClick={()=>setEditingSalary(true)} title="Clique para editar">
                {fmtBRL(period.netSalary)}
                <span className="fin-edit-hint">✎</span>
              </button>
            )}
          </div>

          {/* Additional incomes */}
          {period.additionalIncomes.map(inc => (
            <div key={inc.id} className="fin-income-card fin-income-card--extra">
              <div className="fin-income-card-label">{inc.description}</div>
              <div className="fin-income-value">{fmtBRL(inc.amount)}</div>
              <button className="fin-income-del" onClick={()=>onDeleteIncome(inc.id)} title="Remover">✕</button>
            </div>
          ))}

          {/* Total income */}
          <div className="fin-income-card fin-income-card--total">
            <HelpTip text="Salário líquido mais todas as rendas adicionais e recorrentes lançadas neste período." />
            <div className="fin-income-card-label">Total de Entradas</div>
            <div className="fin-income-value fin-income-value--strong">{fmtBRL(period.totalIncome)}</div>
          </div>
        </div>

        {showAddIncome && (
          <form className="fin-mini-form fin-animate-in" onSubmit={onAddIncome}>
            <input className="fin-input" placeholder="Descrição (ex: Freelance)" value={incomeDesc}
              onChange={e=>setIncomeDesc(e.target.value)} required />
            <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor (R$)"
              value={incomeAmount} onChange={e=>setIncomeAmount(e.target.value)} required />
            <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Adicionar</button>
          </form>
        )}
      </div>

      {/* ── Indicadores de saúde do mês ── */}
      <div className="fin-kpis">
        <KpiCard
          label="Renda do mês" value={period.totalIncome} caption="Total recebido" tone="accent"
          help="Salário líquido mais todas as rendas adicionais e recorrentes deste período."
        />
        <KpiCard
          label="Gastos do mês" value={period.totalSpent}
          pct={pctOf(period.totalSpent, period.totalIncome)}
          caption="Sem contar o investimento" tone="neg"
          help="Tudo que já saiu no período, exceto o investimento — investir não é gastar, então as duas coisas aparecem separadas."
        />
        <KpiCard
          label="Investido no mês" value={period.investedReal}
          pct={pctOf(period.investedReal, period.totalIncome)}
          caption={period.investmentAuto ? '📊 da carteira' : 'Valor manual'} tone="invest"
          help="Quanto você aplicou no período. No modo Carteira o valor vem das compras da sua carteira de investimentos."
        />
        <KpiCard
          label="Poupança do mês" value={period.savedThisMonth}
          pct={pctOf(period.savedThisMonth, period.totalIncome)}
          caption="Sobrou depois de gastar e investir"
          tone={period.savedThisMonth >= 0 ? 'pos' : 'neg'}
          help="O que sobrou das entradas depois dos gastos e do investimento. Defina uma meta mensal para acompanhar o progresso."
        >
          <div className="fin-kpi-goal">
            {editingSavings ? (
              <div className="fin-kpi-goal-edit">
                <span className="fin-kpi-goal-prefix">Meta R$</span>
                <input
                  className="fin-kpi-goal-input"
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  value={savingsTargetInput}
                  onChange={e=>setSavingsTargetInput(e.target.value)}
                  onBlur={onSaveSavingsTarget}
                  onKeyDown={e=>{ if(e.key==='Enter') onSaveSavingsTarget(); if(e.key==='Escape') setEditingSavings(false) }}
                />
              </div>
            ) : (
              <button className="fin-kpi-goal-btn" onClick={()=>setEditingSavings(true)} title="Clique para editar a meta">
                {period.savingsTarget != null
                  ? <>Meta: {fmtBRL(period.savingsTarget)}</>
                  : <span className="fin-kpi-goal-unset">definir meta mensal</span>}
                <span className="fin-edit-hint">✎</span>
              </button>
            )}
            {savingsPct != null && (
              <>
                <div className="fin-kpi-progress-track">
                  <div
                    className="fin-kpi-progress-fill"
                    style={{ width: `${Math.min(Math.max(savingsPct, 0), 100)}%` }}
                  />
                </div>
                <span className="fin-kpi-progress-label">{fmtPct(savingsPct)} da meta</span>
              </>
            )}
          </div>
        </KpiCard>
        <KpiCard
          label="Saldo final esperado" value={saldoFinalEstimado}
          caption={`Faltam ${daysLeft} dia${daysLeft === 1 ? '' : 's'} no período`}
          tone={saldoFinalEstimado >= 0 ? 'pos' : 'neg'}
          help="Projeção do saldo no fim do período: entradas menos os gastos esperados de todos os lançamentos (incluindo o investimento planejado)."
        />
      </div>

      {/* ── Orçamento por categoria + alertas ── */}
      <div className="fin-budget-grid">
        <BudgetSection
          rows={budgetRows}
          view={budgetView}
          onViewChange={setBudgetView}
          showForm={showAddLimit}
          onToggleForm={onToggleLimitForm}
          formType={limitType}
          onFormTypeChange={setLimitType}
          formValue={limitValue}
          onFormValueChange={setLimitValue}
          onSubmit={onSaveLimit}
          onDeleteBudget={onDeleteLimit}
          editingType={editingBudgetType}
          editValue={budgetEditVal}
          onStartEdit={onStartBudgetEdit}
          onEditChange={onBudgetEditChange}
          onCommitEdit={onCommitBudgetEdit}
          onCancelEdit={onCancelBudgetEdit}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* ── Expense Table ── */}
      <div className="fin-table-section fin-animate-in">
        <div className="fin-table-header">
          <h3 className="fin-section-title">Lançamentos
            <HelpTip inline text="Todos os gastos deste período: os recorrentes (já cadastrados na aba Recorrentes) e os avulsos que você lançar aqui. Clique em qualquer valor para editar." />
          </h3>
          <div className="fin-header-actions">
            <button className="fin-link-btn" onClick={()=>onExport('/api/finance/export/current', 'periodo-atual.csv')}>
              ⤓ exportar
            </button>
            <label className="fin-link-btn fin-link-btn--file">
              ⤒ importar
              <input type="file" accept=".csv,text/csv" onChange={onImport} hidden />
            </label>
            <button className={`fin-btn--add ${showAdd ? 'fin-btn--add--active' : ''}`} onClick={()=>setShowAdd(v=>!v)}>
              <span className="fin-btn--add-icon">{showAdd ? '✕' : '+'}</span>
              {showAdd ? 'Fechar' : 'Novo gasto'}
            </button>
          </div>
        </div>

        {showAdd && (
          <form className="fin-add-form fin-animate-in" onSubmit={onAddExpense}>
            <div className="fin-add-row-simple">
              <input className="fin-input" placeholder="Título" value={addTitle}
                onChange={e=>setAddTitle(e.target.value)} required />
              <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor (R$)"
                value={addReal} onChange={e=>setAddReal(e.target.value)} required />
              <select className="fin-input fin-input--short" value={addType}
                onChange={e=>setAddType(e.target.value as ExpenseType)}>
                {ALL_TYPES.filter(t=>t!=='INVESTMENT').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Adicionar</button>
            </div>
          </form>
        )}

        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Gastos esperados
                  <HelpTip inline text="Quanto você planejou gastar nessa linha. Serve de meta para comparar com o que realmente saiu." />
                </th>
                <th className="fin-th--center">Valor gasto
                  <HelpTip inline text="Quanto de fato já saiu nessa linha. Clique no valor para editar." />
                </th>
                <th className="fin-th--center">Tipo</th>
                <th className="fin-th--center">Status
                  <HelpTip inline text="Pago = gasto atingiu o esperado. Parcial = gastou menos que o esperado. Pendente = ainda sem valor. Excedido = gasto passou do esperado." />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Investment row */}
              {inv && (
                <tr className="fin-row fin-row--investment fin-animate-row">
                  <td className="fin-cell-title">
                    <span className="fin-invest-badge">📈</span> Investimento
                    <HelpTip inline text="Quanto você aplicou no mês. Em 'Carteira' o valor vem automaticamente das compras da sua carteira de investimentos; em 'Manual' você digita o valor à mão." />
                  </td>
                  <td>
                    <div className="fin-invest-est">
                      <span>{fmtBRL(inv.estimatedValue)}</span>
                      <div className="fin-invest-inputs">
                        <select
                          className="fin-pct-select"
                          value={investPct}
                          disabled={!period.netSalary}
                          onChange={e=>onInvestPct(parseInt(e.target.value))}
                          title={!period.netSalary ? 'Configure o salário para usar %' : 'Selecione a % do salário'}
                        >
                          {INVEST_PCTS.map(p => (
                            <option key={p} value={p}>{p}%{p===25?' (rec.)':''}</option>
                          ))}
                        </select>
                        <span className="fin-or">ou</span>
                        <input
                          className="fin-invest-manual"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Valor exato"
                          value={investManual}
                          onChange={e=>setInvestManual(e.target.value)}
                          onBlur={onInvestManual}
                          onKeyDown={e=>{ if(e.key==='Enter') onInvestManual() }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="fin-td--center">
                    <div className="fin-invest-real">
                      <div className="fin-invest-toggle" role="group" aria-label="Fonte do valor investido">
                        <button
                          type="button"
                          className={`fin-invest-toggle-btn ${period.investmentAuto ? 'fin-invest-toggle-btn--active' : ''}`}
                          onClick={()=>onSetInvestmentAuto(true)}
                        >Carteira</button>
                        <button
                          type="button"
                          className={`fin-invest-toggle-btn ${!period.investmentAuto ? 'fin-invest-toggle-btn--active' : ''}`}
                          onClick={()=>onSetInvestmentAuto(false)}
                        >Manual</button>
                      </div>
                      {period.investmentAuto ? (
                        <>
                          <span className="fin-invest-real-val" title="Calculado pelas compras da sua carteira neste período">
                            {fmtBRL(period.investedThisMonth)}
                          </span>
                          <span className="fin-invest-real-hint">📊 da carteira</span>
                        </>
                      ) : (
                        <>
                          {editingInvReal ? (
                            <input
                              className="fin-inline-input fin-inline-input--number"
                              autoFocus
                              type="number"
                              step="0.01"
                              value={editCellVal}
                              onChange={e=>onEditChange(e.target.value)}
                              onBlur={onCommit}
                              onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancelEdit() }}
                            />
                          ) : (
                            <span
                              className="fin-editable-cell fin-invest-real-val"
                              onClick={()=>onStartEdit(inv.id, 'real', inv.realValue.toString())}
                              title="Clique para editar"
                            >{fmtBRL(inv.realValue)}</span>
                          )}
                          <button
                            type="button"
                            className="fin-invest-fill"
                            onClick={()=>onStartEdit(inv.id, 'real', String(period.investedThisMonth))}
                            title="Preencher com o valor da carteira"
                          >usar carteira: {fmtBRL(period.investedThisMonth)}</button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="fin-td--center">
                    <span className="fin-type-badge" style={{background:'#378add22',color:'#378add'}}>
                      Investimento
                    </span>
                  </td>
                  <td className="fin-td--center">
                    <span className={`fin-status-badge fin-status-badge--${inv.status.toLowerCase()}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td></td>
                </tr>
              )}

              {/* Recurring section */}
              {nonInvestmentRecurring.length > 0 && (
                <tr className="fin-section-divider">
                  <td colSpan={6}>
                    <span className="fin-divider-label">↻ Recorrentes</span>
                  </td>
                </tr>
              )}
              {nonInvestmentRecurring.map(exp => (
                <ExpenseRow
                  key={exp.id}
                  exp={exp}
                  editCell={editCell}
                  editCellVal={editCellVal}
                  onStartEdit={onStartEdit}
                  onEditChange={onEditChange}
                  onCommit={onCommit}
                  onCancelEdit={onCancelEdit}
                  onMarkPaid={onMarkPaid}
                  onDelete={onDelete}
                />
              ))}

              {/* Non-recurring section */}
              {nonRecurring.length > 0 && (
                <tr className="fin-section-divider">
                  <td colSpan={6}>
                    <span className="fin-divider-label">Avulsos</span>
                  </td>
                </tr>
              )}
              {nonRecurring.map(exp => (
                <ExpenseRow
                  key={exp.id}
                  exp={exp}
                  editCell={editCell}
                  editCellVal={editCellVal}
                  onStartEdit={onStartEdit}
                  onEditChange={onEditChange}
                  onCommit={onCommit}
                  onCancelEdit={onCancelEdit}
                  onMarkPaid={onMarkPaid}
                  onDelete={onDelete}
                />
              ))}

              {period.expenses.length === 0 && (
                <tr><td colSpan={6} className="fin-empty">Nenhum lançamento ainda</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )
}
