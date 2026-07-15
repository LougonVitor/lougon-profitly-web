import type { Dispatch, SetStateAction, FormEvent, ChangeEvent, RefObject } from 'react'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { CurrentPeriod, Expense, ExpenseType, EditCell, EditField, BudgetRow } from '../types'
import { TYPE_LABELS, ALL_TYPES, STATUS_LABELS, INVEST_PCTS } from '../constants'
import {
  fmtBRL, buildCategoryBreakdown, buildBudgetRows, buildAlerts, pctOf, projectSavings, daysLeftInPeriod,
} from '../helpers'
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
  onEditBudget: (row: BudgetRow) => void
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
  onSaveLimit, onDeleteLimit, onEditBudget,
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
  const projected = projectSavings(period.expenses, period.totalIncome)

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
          caption={period.savingsTarget ? `Meta: ${fmtBRL(period.savingsTarget)}` : 'Sobrou depois de gastar e investir'}
          tone={period.savedThisMonth >= 0 ? 'pos' : 'neg'}
          progressPct={savingsPct}
          progressLabel={savingsPct != null ? `${Math.round(savingsPct)}% da meta` : undefined}
          help="O que sobrou das entradas depois dos gastos e do investimento. Defina uma meta mensal para acompanhar o progresso."
        />
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
          onEditBudget={onEditBudget}
          onDeleteBudget={onDeleteLimit}
        />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* ── Meta de poupança + projeção ── */}
      <div className="fin-savings-strip fin-animate-in">
        <div className="fin-savings-tip">
          <span className="fin-savings-tip-icon">💡</span>
          <div>
            <div className="fin-savings-tip-title">Dica do mês</div>
            <p className="fin-savings-tip-text">{savingsTip(savingsPct, period.savedThisMonth, alerts.length)}</p>
          </div>
        </div>

        <div className="fin-savings-block">
          <div className="fin-savings-label">
            Meta de poupança
            <HelpTip inline text="Quanto você pretende guardar por mês. Serve de referência para o card de Poupança do mês." />
          </div>
          {editingSavings ? (
            <div className="fin-salary-edit">
              <span className="fin-salary-prefix">R$</span>
              <input
                className="fin-salary-input"
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
            <button className="fin-savings-value" onClick={()=>setEditingSavings(true)} title="Clique para editar">
              {period.savingsTarget
                ? <>{fmtBRL(period.savedThisMonth)} <span className="fin-savings-of">/ {fmtBRL(period.savingsTarget)}</span></>
                : <span className="fin-savings-unset">definir meta</span>}
              <span className="fin-edit-hint">✎</span>
            </button>
          )}
          {savingsPct != null && (
            <div className="fin-savings-track">
              <div
                className="fin-savings-fill"
                style={{ width: `${Math.min(Math.max(savingsPct, 0), 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="fin-savings-block">
          <div className="fin-savings-label">Dias restantes no mês</div>
          <div className="fin-savings-big">{daysLeft}</div>
        </div>

        <div className="fin-savings-block">
          <div className="fin-savings-label">
            Projeção de poupança
            <HelpTip inline text="Estimativa do que sobra no fim do período se cada lançamento fechar no valor planejado — já contando as categorias que passaram do orçamento." />
          </div>
          <div className={`fin-savings-big ${projected < 0 ? 'fin-savings-big--neg' : ''}`}>
            {fmtBRL(projected)}
          </div>
          {period.savingsTarget != null && (
            <span className="fin-savings-note">
              {projected >= period.savingsTarget
                ? 'Você deve alcançar sua meta! 🎉'
                : `Faltam ${fmtBRL(period.savingsTarget - projected)} para a meta`}
            </span>
          )}
        </div>
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

      {/* ── Gastos por categoria: donut (estimated share) + estimated-vs-real per category ── */}
      {(() => {
        const { rows, max } = buildCategoryBreakdown(period.expenses)
        if (rows.length === 0) return null
        const donutData = rows.filter(r => r.estimated > 0)
        return (
          <div className="fin-chart-section fin-animate-in">
            <div className="fin-cat-header">
              <h3 className="fin-section-title">Gastos por categoria</h3>
              <span className="fin-cat-caption">barra: esperado (clara) vs gasto (sólida)</span>
            </div>
            <div className="fin-breakdown">
              {donutData.length > 0 && (
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="estimated"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {donutData.map(d => <Cell key={d.type} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtBRL(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="fin-breakdown-legend">
                {rows.map(r => {
                  const estPct = max > 0 ? (r.estimated / max) * 100 : 0
                  const realPct = max > 0 ? (r.real / max) * 100 : 0
                  const over = r.estimated > 0 && r.real > r.estimated
                  const realColor = over ? '#ef4444' : r.color
                  return (
                    <div key={r.type} className="fin-cat-row">
                      <div className="fin-cat-line">
                        <span className="fin-cat-dot" style={{background:r.color}} />
                        <span className="fin-cat-name">{r.name}</span>
                        <span className="fin-cat-real" style={{color:realColor}}>{fmtBRL(r.real)}</span>
                        <span className="fin-cat-est">/ {fmtBRL(r.estimated)}</span>
                      </div>
                      <div className="fin-cat-track">
                        <div className="fin-cat-est-bar" style={{width:`${estPct}%`}} />
                        <div className="fin-cat-real-bar" style={{width:`${realPct}%`, background:realColor}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

/** Frase da "Dica do mês": comenta o que os números já mostram, sem inventar conselho. */
function savingsTip(savingsPct: number | null, saved: number, alertCount: number): string {
  if (saved < 0) {
    return 'Suas saídas passaram das entradas neste período. Revise as categorias acima para ver onde ajustar.'
  }
  if (savingsPct == null) {
    return 'Defina uma meta de poupança para o sistema acompanhar seu progresso todo mês.'
  }
  if (savingsPct >= 100) return 'Você já bateu sua meta de poupança neste mês. Excelente! 🎉'
  if (savingsPct >= 60) return 'Você está muito perto de atingir sua meta de poupança. Continue assim!'
  if (alertCount > 0) return 'Alguns orçamentos estão perto do limite — segurar neles ajuda a chegar na meta.'
  return 'Ainda dá tempo de aumentar sua poupança neste mês. Pequenos cortes fazem diferença.'
}
