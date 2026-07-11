import type { Dispatch, SetStateAction, FormEvent, ChangeEvent, RefObject } from 'react'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { CurrentPeriod, Expense, ExpenseType, EditCell, EditField } from '../types'
import { TYPE_LABELS, TYPE_COLORS, ALL_TYPES, STATUS_LABELS, INVEST_PCTS } from '../constants'
import { fmtBRL, buildCategoryBreakdown, spentForType } from '../helpers'
import { SummaryCard } from '../components/SummaryCard'
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
  // Budget limits
  showAddLimit: boolean; setShowAddLimit: Dispatch<SetStateAction<boolean>>
  limitType: ExpenseType; setLimitType: Dispatch<SetStateAction<ExpenseType>>
  limitValue: string; setLimitValue: Dispatch<SetStateAction<string>>
  onSaveLimit: (e: FormEvent) => void
  onDeleteLimit: (type: ExpenseType) => void
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
  showAddLimit, setShowAddLimit, limitType, setLimitType, limitValue, setLimitValue,
  onSaveLimit, onDeleteLimit,
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

  return (
    <>
      {/* ── Income section ── */}
      <div className="fin-income-section fin-animate-in">
        <div className="fin-income-header">
          <h3 className="fin-section-title">Entradas do mês</h3>
          <button className="fin-link-btn" onClick={()=>setShowAddIncome(v=>!v)}>
            {showAddIncome ? '✕ fechar' : '+ renda adicional'}
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

      {/* ── Summary Cards ── */}
      <div className="fin-cards">
        <SummaryCard label="Total Gasto" value={period.totalReal} icon="💳"
          help="Soma de tudo que você já gastou neste período — a coluna Valor gasto de todos os lançamentos." />
        <SummaryCard label="Saldo Atual" value={period.balance} icon={period.balance >= 0 ? '✅' : '⚠️'}
          tone={period.balance >= 0 ? 'pos' : 'neg'}
          help="Total de entradas menos o que você já gastou. É quanto ainda sobra do que entrou até agora." />
        <SummaryCard label="Valor esperado" value={period.totalEstimated} icon="📋"
          help="Soma do que você planejou gastar no período — a coluna Valor esperado de cada lançamento." />
        <SummaryCard label="Saldo Final Esperado" value={saldoFinalEstimado} icon="🎯"
          tone={saldoFinalEstimado >= 0 ? 'pos' : 'neg'}
          help="Projeção do saldo no fim do período: entradas menos o valor esperado de todos os gastos (incluindo o investimento planejado)." />
      </div>

      {/* ── Budget limits ── */}
      <div className="fin-limits-section fin-animate-in">
        <div className="fin-table-header">
          <h3 className="fin-section-title">Limites de gastos</h3>
          <button className="fin-link-btn" onClick={()=>setShowAddLimit(v=>!v)}>
            {showAddLimit ? '✕ fechar' : '+ definir limite'}
          </button>
        </div>

        {showAddLimit && (
          <form className="fin-mini-form fin-animate-in" onSubmit={onSaveLimit}>
            <select className="fin-input fin-input--short" value={limitType}
              onChange={e=>setLimitType(e.target.value as ExpenseType)}>
              {ALL_TYPES.filter(t=>t!=='INVESTMENT').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input className="fin-input fin-input--short" type="number" step="0.01" min="0"
              placeholder="Limite mensal (R$)" value={limitValue}
              onChange={e=>setLimitValue(e.target.value)} required />
            <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Salvar</button>
          </form>
        )}

        {period.budgetLimits.length === 0 ? (
          <p className="fin-recurring-desc">
            Defina limites por categoria para acompanhar quanto já gastou e receber alertas ao ultrapassá-los.
          </p>
        ) : (
          <div className="fin-limits-grid">
            {period.budgetLimits.map(limit => {
              const spent = spentForType(period.expenses, limit.type)
              const ratio = limit.monthlyLimit > 0 ? spent / limit.monthlyLimit : 0
              const pct = Math.min(ratio * 100, 100)
              const state = ratio > 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok'
              return (
                <div key={limit.type} className={`fin-limit-card fin-limit-card--${state}`}>
                  <div className="fin-limit-head">
                    <span className="fin-type-badge"
                      style={{background:TYPE_COLORS[limit.type]+'22', color:TYPE_COLORS[limit.type]}}>
                      {TYPE_LABELS[limit.type]}
                    </span>
                    <button className="fin-limit-del" onClick={()=>onDeleteLimit(limit.type)} title="Remover limite">✕</button>
                  </div>
                  <div className="fin-limit-values">
                    <span className="fin-limit-spent">{fmtBRL(spent)}</span>
                    <span className="fin-limit-sep"> / {fmtBRL(limit.monthlyLimit)}</span>
                  </div>
                  <div className="fin-limit-bar">
                    <div className="fin-limit-bar-fill" style={{width:`${pct}%`}} />
                  </div>
                  {state === 'over' && (
                    <span className="fin-limit-alert">⚠️ Excedeu em {fmtBRL(spent - limit.monthlyLimit)}</span>
                  )}
                  {state === 'warn' && (
                    <span className="fin-limit-note">{Math.round(ratio*100)}% do limite</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Expense Table ── */}
      <div className="fin-table-section fin-animate-in">
        <div className="fin-table-header">
          <h3 className="fin-section-title">Lançamentos</h3>
          <div className="fin-header-actions">
            <button className="fin-link-btn" onClick={()=>onExport('/api/finance/export/current', 'periodo-atual.csv')}>
              ⤓ exportar
            </button>
            <label className="fin-link-btn fin-link-btn--file">
              ⤒ importar
              <input type="file" accept=".csv,text/csv" onChange={onImport} hidden />
            </label>
            <button className="fin-link-btn" onClick={()=>setShowAdd(v=>!v)}>
              {showAdd ? '✕ fechar' : '+ novo gasto'}
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
                <th>Valor esperado</th>
                <th className="fin-th--center">Valor gasto</th>
                <th className="fin-th--center">Tipo</th>
                <th className="fin-th--center">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Investment row */}
              {inv && (
                <tr className="fin-row fin-row--investment fin-animate-row">
                  <td className="fin-cell-title">
                    <span className="fin-invest-badge">📈</span> Investimento
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
