import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { api } from '../../lib/api'
import './Finance.css'

// ── Types ─────────────────────────────────────────────────────────────────────
type ExpenseType = 'INVESTMENT'|'HOME'|'SIGNATURE'|'SPORT'|'LOCOMOTION'|
  'SUPERMARKET'|'LEISURE'|'CREDIT'|'MEDICINE'|'SEPARATE'|'EDUCATION'|'STYLE'
type ExpenseStatus = 'PAID'|'PARTIAL'|'PENDING'|'OVERRUN'

interface Expense {
  id: number
  title: string
  estimatedValue: number | null
  realValue: number
  status: ExpenseStatus
  type: ExpenseType
  createdAt: string
  recurring: boolean
}

interface AdditionalIncome {
  id: number
  description: string
  amount: number
  createdAt: string
}

interface BudgetLimit {
  type: ExpenseType
  monthlyLimit: number
}

interface CurrentPeriod {
  expenses: Expense[]
  netSalary: number | null
  investmentTarget: number | null
  totalReal: number
  totalEstimated: number
  balance: number
  resetDay: number
  additionalIncomes: AdditionalIncome[]
  totalIncome: number
  budgetLimits: BudgetLimit[]
}

interface RecurringExpense {
  id: number
  title: string
  estimatedValue: number | null
  type: ExpenseType
  dueDay: number | null
  variable: boolean
}

interface RecurringIncome {
  id: number
  description: string
  amount: number
  dueDay: number | null
}

interface Settings { resetDay: number; netSalary: number | null; investmentTarget: number | null }
interface TypeTotal { type: ExpenseType; totalReal: number; totalEstimated: number }
interface MonthSummary { yearMonth: string; byType: TypeTotal[]; total: number }
interface HistoryData { months: MonthSummary[]; availableMonths: string[] }

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<ExpenseType, string> = {
  INVESTMENT:'Investimento', HOME:'Casa', SIGNATURE:'Assinaturas',
  SPORT:'Esporte', LOCOMOTION:'Locomoção', SUPERMARKET:'Supermercado',
  LEISURE:'Lazer', CREDIT:'Crédito', MEDICINE:'Medicina',
  SEPARATE:'Avulso', EDUCATION:'Educação', STYLE:'Estilo',
}
const TYPE_COLORS: Record<ExpenseType, string> = {
  INVESTMENT:'#378add', HOME:'#22c55e', SIGNATURE:'#f59e0b',
  SPORT:'#8b5cf6', LOCOMOTION:'#06b6d4', SUPERMARKET:'#f97316',
  LEISURE:'#ec4899', CREDIT:'#64748b', MEDICINE:'#ef4444',
  SEPARATE:'#a78bfa', EDUCATION:'#10b981', STYLE:'#d97706',
}
const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PAID:'Pago', PARTIAL:'Parcial', PENDING:'Pendente', OVERRUN:'Excedido',
}
const ALL_TYPES = Object.keys(TYPE_LABELS) as ExpenseType[]
const INVEST_PCTS = Array.from({length: 101}, (_, i) => i)

function fmtBRL(v: number | null | undefined) {
  if (v == null) return 'R$ —'
  return `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m)-1]}/${y}`
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Finance() {
  const [tab, setTab] = useState<'current'|'recurring'|'history'>('current')
  const [period, setPeriod] = useState<CurrentPeriod | null>(null)
  const [recurringList, setRecurringList] = useState<RecurringExpense[]>([])
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [settings, setSettings] = useState<Settings>({ resetDay: 10, netSalary: null, investmentTarget: null })
  const [loading, setLoading] = useState(true)

  // Salary editing
  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const salaryRef = useRef<HTMLInputElement>(null)

  // Add income
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [incomeDesc, setIncomeDesc] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')

  // Add non-recurring expense
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addReal, setAddReal] = useState('')
  const [addType, setAddType] = useState<ExpenseType>('LEISURE')

  // Add recurring config
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [recTitle, setRecTitle] = useState('')
  const [recEstimated, setRecEstimated] = useState('')
  const [recType, setRecType] = useState<ExpenseType>('HOME')
  const [recDueDay, setRecDueDay] = useState('')
  const [recVariable, setRecVariable] = useState(false)

  // Recurring incomes
  const [recurringIncomeList, setRecurringIncomeList] = useState<RecurringIncome[]>([])
  const [showAddRecIncome, setShowAddRecIncome] = useState(false)
  const [recIncDesc, setRecIncDesc] = useState('')
  const [recIncAmount, setRecIncAmount] = useState('')
  const [recIncDueDay, setRecIncDueDay] = useState('')

  // Inline cell editing
  const [editCell, setEditCell] = useState<{id:number; field:'title'|'estimated'|'real'|'type'} | null>(null)
  const [editCellVal, setEditCellVal] = useState('')

  // Investment % selector and manual entry
  const [investPct, setInvestPct] = useState<number>(25)
  const [investManual, setInvestManual] = useState('')

  // Budget limits
  const [showAddLimit, setShowAddLimit] = useState(false)
  const [limitType, setLimitType] = useState<ExpenseType>('SUPERMARKET')
  const [limitValue, setLimitValue] = useState('')

  // History filter
  const [histFrom, setHistFrom] = useState('')
  const [histTo, setHistTo] = useState('')

  // Reset modal
  const [resetModal, setResetModal] = useState<{ show: boolean; hasConflict: boolean; confirmed: boolean }>({ show: false, hasConflict: false, confirmed: false })


  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (period?.netSalary && investmentExpense()?.estimatedValue) {
      const pct = Math.round((investmentExpense()!.estimatedValue! / period.netSalary) * 100)
      if (INVEST_PCTS.includes(pct)) setInvestPct(pct)
    }
  }, [period])

  useEffect(() => {
    if (editingSalary && salaryRef.current) salaryRef.current.focus()
  }, [editingSalary])

  useEffect(() => {
    if (tab === 'history') loadHistory()
    if (tab === 'recurring') loadRecurring()
  }, [tab, histFrom, histTo])

  function investmentExpense() {
    return period?.expenses.find(e => e.type === 'INVESTMENT') ?? null
  }

  async function loadAll() {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        api.get<CurrentPeriod>('/api/finance/current'),
        api.get<Settings>('/api/finance/settings'),
      ])
      setPeriod(pRes.data)
      setSettings(sRes.data)
      setSettingsResetDay(sRes.data.resetDay.toString())
      setSalaryInput(sRes.data.netSalary?.toString() ?? '')
    } catch (err: unknown) {
      // 401/403 handled by PrivateRoute — no redirect needed here
    } finally { setLoading(false) }
  }

  async function refreshPeriod() {
    const res = await api.get<CurrentPeriod>('/api/finance/current')
    setPeriod(res.data)
  }

  async function refreshSettings() {
    const res = await api.get<Settings>('/api/finance/settings')
    setSettings(res.data)
    setSettingsResetDay(res.data.resetDay.toString())
    setSalaryInput(res.data.netSalary?.toString() ?? '')
  }

  async function loadHistory() {
    const params: Record<string, string> = {}
    if (histFrom) params.from = histFrom
    if (histTo) params.to = histTo
    const res = await api.get<HistoryData>('/api/finance/history', { params })
    setHistory(res.data)
  }

  async function loadRecurring() {
    const [rec, inc] = await Promise.all([
      api.get<RecurringExpense[]>('/api/finance/recurring'),
      api.get<RecurringIncome[]>('/api/finance/recurring-income'),
    ])
    setRecurringList(rec.data)
    setRecurringIncomeList(inc.data)
  }

  async function handleSaveSalary() {
    setEditingSalary(false)
    const val = salaryInput ? parseFloat(salaryInput) : null
    await api.put('/api/finance/settings', {
      resetDay: settings.resetDay,
      netSalary: val,
      investmentTarget: settings.investmentTarget,
    })
    await Promise.all([refreshSettings(), refreshPeriod()])
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/finance/income', { description: incomeDesc, amount: parseFloat(incomeAmount) })
    setIncomeDesc(''); setIncomeAmount(''); setShowAddIncome(false)
    await refreshPeriod()
  }

  async function handleDeleteIncome(id: number) {
    await api.delete(`/api/finance/income/${id}`)
    await refreshPeriod()
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const real = parseFloat(addReal)
    await api.post('/api/finance/expenses', {
      title: addTitle,
      estimatedValue: real,
      realValue: real,
      type: addType,
      recurring: false,
    })
    setShowAdd(false); setAddTitle(''); setAddReal('')
    await refreshPeriod()
  }

  async function handleDelete(id: number) {
    if (!confirm('Remover este lançamento?')) return
    await api.delete(`/api/finance/expenses/${id}`)
    await refreshPeriod()
  }

  async function handleMarkPaid(exp: Expense) {
    if (exp.estimatedValue == null) return
    await api.patch(`/api/finance/expenses/${exp.id}`, { realValue: exp.estimatedValue })
    await refreshPeriod()
  }

  async function handleInvestPct(pct: number) {
    setInvestPct(pct)
    const inv = investmentExpense()
    if (!inv || !period?.netSalary) return
    const estimated = Math.round(period.netSalary * pct / 100 * 100) / 100
    await api.patch(`/api/finance/expenses/${inv.id}`, { estimatedValue: estimated })
    setInvestManual('')
    await refreshPeriod()
  }

  async function handleInvestManual() {
    const inv = investmentExpense()
    if (!inv || !investManual) return
    await api.patch(`/api/finance/expenses/${inv.id}`, { estimatedValue: parseFloat(investManual) })
    setInvestManual('')
    await refreshPeriod()
  }

  async function handleInvestRealChange(val: string) {
    const inv = investmentExpense()
    if (!inv) return
    await api.patch(`/api/finance/expenses/${inv.id}`, { realValue: parseFloat(val) || 0 })
    await refreshPeriod()
  }

  function startEdit(id: number, field: 'title'|'estimated'|'real'|'type', currentVal: string) {
    setEditCell({ id, field })
    setEditCellVal(currentVal)
  }

  async function commitEdit() {
    if (!editCell) return
    const { id, field } = editCell
    const body: Record<string, string|number> = {}
    if (field === 'title') body.title = editCellVal
    else if (field === 'estimated') body.estimatedValue = parseFloat(editCellVal) || 0
    else if (field === 'real') body.realValue = parseFloat(editCellVal) || 0
    else body.type = editCellVal
    await api.patch(`/api/finance/expenses/${id}`, body)
    setEditCell(null)
    await refreshPeriod()
  }

  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/finance/recurring', {
      title: recTitle,
      estimatedValue: recEstimated ? parseFloat(recEstimated) : null,
      type: recType,
      dueDay: recDueDay ? parseInt(recDueDay) : null,
      variable: recVariable,
    })
    setRecTitle(''); setRecEstimated(''); setRecDueDay(''); setRecVariable(false); setShowAddRecurring(false)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleDeleteRecurring(id: number) {
    if (!confirm('Remover gasto recorrente?')) return
    await api.delete(`/api/finance/recurring/${id}`)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleAddRecIncome(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/finance/recurring-income', {
      description: recIncDesc,
      amount: parseFloat(recIncAmount),
      dueDay: recIncDueDay ? parseInt(recIncDueDay) : null,
    })
    setRecIncDesc(''); setRecIncAmount(''); setRecIncDueDay(''); setShowAddRecIncome(false)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleDeleteRecIncome(id: number) {
    if (!confirm('Remover renda recorrente?')) return
    await api.delete(`/api/finance/recurring-income/${id}`)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleSaveLimit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(limitValue)
    if (!value || value <= 0) return
    await api.put('/api/finance/budget-limits', { type: limitType, monthlyLimit: value })
    setLimitValue(''); setShowAddLimit(false)
    await refreshPeriod()
  }

  async function handleDeleteLimit(type: ExpenseType) {
    await api.delete(`/api/finance/budget-limits/${type}`)
    await refreshPeriod()
  }

  async function handleReset() {
    const { data: hasConflict } = await api.get<boolean>('/api/finance/reset/check')
    setResetModal({ show: true, hasConflict, confirmed: false })
  }

  async function confirmReset() {
    setResetModal(m => ({ ...m, show: false }))
    await api.post('/api/finance/reset')
    await refreshPeriod()
  }

  if (loading) return (
    <div className="fin-page">
      <div className="page-container fin-container">
        <div className="fin-loading"><span className="fin-spinner" />Carregando...</div>
      </div>
    </div>
  )

  const inv = investmentExpense()
  const nonInvestmentRecurring = period?.expenses.filter(e => e.recurring && e.type !== 'INVESTMENT') ?? []
  const nonRecurring = period?.expenses.filter(e => !e.recurring) ?? []

  return (
    <div className="fin-page">
      <div className="page-container fin-container">
        {/* ── Tabs ── */}
        <div className="fin-tabs">
          <button className={`fin-tab ${tab==='current'?'fin-tab--active':''}`} onClick={()=>setTab('current')}>
            Período Atual
          </button>
          <button className={`fin-tab ${tab==='recurring'?'fin-tab--active':''}`} onClick={()=>setTab('recurring')}>
            Recorrentes
          </button>
          <button className={`fin-tab ${tab==='history'?'fin-tab--active':''}`} onClick={()=>setTab('history')}>
            Histórico
          </button>
          <div className="fin-tabs-actions">
            <button className="fin-btn fin-btn--ghost fin-btn--sm fin-btn--muted" onClick={handleReset}>
              ↺ Fechar período
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'current' && period && (
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
                        onBlur={handleSaveSalary}
                        onKeyDown={e=>{ if(e.key==='Enter') handleSaveSalary(); if(e.key==='Escape') setEditingSalary(false) }}
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
                    <button className="fin-income-del" onClick={()=>handleDeleteIncome(inc.id)} title="Remover">✕</button>
                  </div>
                ))}

                {/* Total income */}
                <div className="fin-income-card fin-income-card--total">
                  <div className="fin-income-card-label">Total de Entradas</div>
                  <div className="fin-income-value fin-income-value--strong">{fmtBRL(period.totalIncome)}</div>
                </div>
              </div>

              {showAddIncome && (
                <form className="fin-mini-form fin-animate-in" onSubmit={handleAddIncome}>
                  <input className="fin-input" placeholder="Descrição (ex: Freelance)" value={incomeDesc}
                    onChange={e=>setIncomeDesc(e.target.value)} required />
                  <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor (R$)"
                    value={incomeAmount} onChange={e=>setIncomeAmount(e.target.value)} required />
                  <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Adicionar</button>
                </form>
              )}
            </div>

            {/* ── Summary Cards ── */}
            {(() => {
              // If investment has no estimatedValue yet, fall back to investmentTarget from settings
              const invEst = inv?.estimatedValue ?? period.investmentTarget ?? 0
              const extraInvDeduction = inv?.estimatedValue == null ? invEst : 0
              const saldoFinalEstimado = period.totalIncome - period.totalEstimated - extraInvDeduction
              return (
                <div className="fin-cards">
                  <SummaryCard label="Total Gasto" value={period.totalReal} icon="💳" />
                  <SummaryCard label="Saldo Atual" value={period.balance} icon={period.balance >= 0 ? '✅' : '⚠️'} />
                  <SummaryCard label="Gastos Estimados" value={period.totalEstimated} icon="📋" />
                  <SummaryCard label="Saldo Final Estimado" value={saldoFinalEstimado} icon="🎯" />
                </div>
              )
            })()}

            {/* ── Budget limits ── */}
            <div className="fin-limits-section fin-animate-in">
              <div className="fin-table-header">
                <h3 className="fin-section-title">Limites de gastos</h3>
                <button className="fin-link-btn" onClick={()=>setShowAddLimit(v=>!v)}>
                  {showAddLimit ? '✕ fechar' : '+ definir limite'}
                </button>
              </div>

              {showAddLimit && (
                <form className="fin-mini-form fin-animate-in" onSubmit={handleSaveLimit}>
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
                          <button className="fin-limit-del" onClick={()=>handleDeleteLimit(limit.type)} title="Remover limite">✕</button>
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
                <button className="fin-link-btn" onClick={()=>setShowAdd(v=>!v)}>
                  {showAdd ? '✕ fechar' : '+ novo gasto'}
                </button>
              </div>

              {showAdd && (
                <form className="fin-add-form fin-animate-in" onSubmit={handleAddExpense}>
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
                      <th>Estimado</th>
                      <th className="fin-th--center">Real</th>
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
                                onChange={e=>handleInvestPct(parseInt(e.target.value))}
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
                                onBlur={handleInvestManual}
                                onKeyDown={e=>{ if(e.key==='Enter') handleInvestManual() }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="fin-td--center">
                          <div className="fin-real-cell">
                            <InlineNumberCell
                              value={inv.realValue}
                              editing={editCell?.id===inv.id && editCell.field==='real'}
                              editVal={editCellVal}
                              onStart={()=>startEdit(inv.id,'real',inv.realValue.toString())}
                              onChange={setEditCellVal}
                              onCommit={commitEdit}
                              onCancel={()=>setEditCell(null)}
                            />
                            {inv.estimatedValue != null && inv.realValue < inv.estimatedValue && (
                              <button className="fin-pay-btn" onClick={()=>handleMarkPaid(inv)} title="Marcar como pago (preencher valor estimado)">✓</button>
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
                        onStartEdit={startEdit}
                        onEditChange={setEditCellVal}
                        onCommit={commitEdit}
                        onCancelEdit={()=>setEditCell(null)}
                        onMarkPaid={handleMarkPaid}
                        onDelete={handleDelete}
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
                        onStartEdit={startEdit}
                        onEditChange={setEditCellVal}
                        onCommit={commitEdit}
                        onCancelEdit={()=>setEditCell(null)}
                        onMarkPaid={handleMarkPaid}
                        onDelete={handleDelete}
                      />
                    ))}

                    {period.expenses.length === 0 && (
                      <tr><td colSpan={6} className="fin-empty">Nenhum lançamento ainda</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Charts ── */}
            {period.expenses.length > 1 && (
              <div className="fin-chart-section fin-animate-in">
                <h3 className="fin-section-title" style={{marginBottom:'1rem'}}>Gastos por categoria</h3>
                <ResponsiveContainer width="100%" height={buildGroupedData(period.expenses).length * 56 + 40}>
                  <BarChart
                    layout="vertical"
                    data={buildGroupedData(period.expenses)}
                    margin={{top:0, right:10, left:10, bottom:0}}
                    barCategoryGap="30%"
                    barGap={3}
                  >
                    <XAxis
                      type="number"
                      tick={{fontSize:11}}
                      tickFormatter={(v:number) => fmtBRL(v)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{fontSize:12}}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(v:number) => fmtBRL(v)} />
                    <Legend
                      formatter={(value) => value === 'estimated' ? 'Valor Estimado' : 'Valor Real'}
                    />
                    <Bar dataKey="estimated" name="estimated" fill="#4b5563" radius={[0,4,4,0]}
                      label={{position:'right', fontSize:10, formatter:(v:number)=>v>0?fmtBRL(v):''}} />
                    <Bar dataKey="real" name="real" fill="#e85d5d" radius={[0,4,4,0]}
                      label={{position:'right', fontSize:10, formatter:(v:number)=>v>0?fmtBRL(v):''}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Pie Chart: Estimated % ── */}
            {period.expenses.some(e => (e.estimatedValue ?? 0) > 0) && (
              <div className="fin-chart-section fin-animate-in">
                <h3 className="fin-section-title" style={{marginBottom:'1.5rem'}}>Gastos Estimados em %</h3>
                <ResponsiveContainer width="100%" height={420}>
                  <PieChart>
                    <Pie
                      data={buildPieData(period.expenses)}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={170}
                      labelLine={{stroke:'#94a3b8', strokeWidth:1}}
                      label={({name, percent}) => `${name}\n${(percent*100).toFixed(1)}%`}
                    >
                      {buildPieData(period.expenses).map((d, i) => (
                        <Cell key={i} fill={d.color} fillOpacity={0.75} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v:number) => fmtBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'recurring' && (
          <div className="fin-recurring fin-animate-in">
            <div className="fin-table-header">
              <h3 className="fin-section-title">Gastos Recorrentes</h3>
              <button className="fin-link-btn" onClick={()=>setShowAddRecurring(v=>!v)}>
                {showAddRecurring ? '✕ fechar' : '+ novo recorrente'}
              </button>
            </div>
            <p className="fin-recurring-desc">
              Gastos configurados aqui são adicionados automaticamente a cada período.
            </p>

            {showAddRecurring && (
              <form className="fin-add-form fin-animate-in" onSubmit={handleAddRecurring}>
                <div className="fin-add-row-simple">
                  <input className="fin-input" placeholder="Título (ex: Aluguel)" value={recTitle}
                    onChange={e=>setRecTitle(e.target.value)} required />
                  <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Estimado (R$)"
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
                  <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Adicionar</button>
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
                      <th>Estimado</th>
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
                          <button className="fin-del-btn" onClick={()=>handleDeleteRecurring(r.id)} title="Remover">✕</button>
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
              <button className="fin-link-btn" onClick={()=>setShowAddRecIncome(v=>!v)}>
                {showAddRecIncome ? '✕ fechar' : '+ nova renda recorrente'}
              </button>
            </div>
            <p className="fin-recurring-desc">
              Rendas configuradas aqui são adicionadas automaticamente às entradas de cada período.
            </p>

            {showAddRecIncome && (
              <form className="fin-add-form fin-animate-in" onSubmit={handleAddRecIncome}>
                <div className="fin-add-row-simple">
                  <input className="fin-input" placeholder="Descrição (ex: Aluguel recebido)" value={recIncDesc}
                    onChange={e=>setRecIncDesc(e.target.value)} required />
                  <input className="fin-input fin-input--short" type="number" step="0.01" placeholder="Valor (R$)"
                    value={recIncAmount} onChange={e=>setRecIncAmount(e.target.value)} required />
                  <input className="fin-input fin-input--tiny" type="number" min="1" max="31" placeholder="Dia"
                    value={recIncDueDay} onChange={e=>setRecIncDueDay(e.target.value)} title="Dia do recebimento (1-31)" />
                  <button className="fin-btn fin-btn--ghost fin-btn--sm" type="submit">Adicionar</button>
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
                          <button className="fin-del-btn" onClick={()=>handleDeleteRecIncome(r.id)} title="Remover">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div className="fin-history fin-animate-in">
            <div className="fin-history-filters">
              <h3 className="fin-section-title">Histórico de gastos</h3>
              <div className="fin-filter-row">
                <div className="fin-field">
                  <label>De</label>
                  <select className="fin-input" value={histFrom} onChange={e=>setHistFrom(e.target.value)}>
                    <option value="">Início</option>
                    {history?.availableMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
                  </select>
                </div>
                <div className="fin-field">
                  <label>Até</label>
                  <select className="fin-input" value={histTo} onChange={e=>setHistTo(e.target.value)}>
                    <option value="">Fim</option>
                    {history?.availableMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {!history || history.months.length === 0 ? (
              <div className="fin-empty-state">
                <span>📊</span>
                <p>Nenhum histórico disponível ainda.<br />O histórico é gerado ao resetar o período.</p>
              </div>
            ) : (
              <>
                {(() => {
                  const mom = buildMoM(history.months)
                  if (!mom) return null
                  return (
                    <div className="fin-mom fin-animate-in">
                      <h4 className="fin-subsection-title">
                        Comparação mensal — {fmtMonth(mom.curr.yearMonth)} vs {fmtMonth(mom.prev.yearMonth)}
                      </h4>
                      <div className="fin-mom-cards">
                        <div className={`fin-mom-card fin-mom-card--${mom.totalDelta > 0 ? 'up' : 'down'}`}>
                          <div className="fin-mom-label">Variação total</div>
                          <div className="fin-mom-value">
                            {mom.totalDelta >= 0 ? '+' : '-'}{fmtBRL(Math.abs(mom.totalDelta))}
                          </div>
                          {mom.totalPct != null && (
                            <div className="fin-mom-sub">
                              {mom.totalDelta >= 0 ? '+' : '-'}{Math.abs(mom.totalPct).toFixed(1)}% vs mês anterior
                            </div>
                          )}
                        </div>
                        <div className="fin-mom-card">
                          <div className="fin-mom-label">Precisão do orçamento</div>
                          <div className="fin-mom-value">
                            {mom.accuracyPct != null ? `${mom.accuracyPct.toFixed(0)}%` : '—'}
                          </div>
                          <div className="fin-mom-sub">
                            Real {fmtBRL(mom.curr.total)} de {fmtBRL(mom.estimated)} estimado
                          </div>
                        </div>
                      </div>
                      {mom.movers.length > 0 && (
                        <div className="fin-mom-movers">
                          <div className="fin-mom-movers-title">Maiores variações por categoria</div>
                          {mom.movers.slice(0, 5).map(m => (
                            <div key={m.type} className="fin-mom-mover">
                              <span className="fin-type-dot" style={{background: TYPE_COLORS[m.type]}} />
                              <span className="fin-mom-mover-name">{TYPE_LABELS[m.type]}</span>
                              <span className={`fin-mom-mover-delta ${m.delta > 0 ? 'up' : 'down'}`}>
                                {m.delta >= 0 ? '+' : '-'}{fmtBRL(Math.abs(m.delta))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <div className="fin-chart-section">
                  <h4 className="fin-subsection-title">Total gasto por mês</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={history.months.map(m=>({name: fmtMonth(m.yearMonth), total: m.total}))}>
                      <XAxis dataKey="name" tick={{fontSize:12}} />
                      <YAxis tick={{fontSize:12}} />
                      <Tooltip formatter={(v:number) => fmtBRL(v)} />
                      <Bar dataKey="total" fill="#378add" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="fin-chart-section">
                  <h4 className="fin-subsection-title">Gastos por categoria ao longo do tempo</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={history.months.map(m => {
                      const row: Record<string, number|string> = { name: fmtMonth(m.yearMonth) }
                      m.byType.forEach(t => { row[TYPE_LABELS[t.type]] = t.totalReal })
                      return row
                    })}>
                      <XAxis dataKey="name" tick={{fontSize:12}} />
                      <YAxis tick={{fontSize:12}} />
                      <Tooltip formatter={(v:number) => fmtBRL(v)} />
                      <Legend />
                      {ALL_TYPES.filter(t => history.months.some(m => m.byType.some(b => b.type === t))).map(t => (
                        <Bar key={t} dataKey={TYPE_LABELS[t]} stackId="a" fill={TYPE_COLORS[t]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="fin-history-cards">
                  {[...history.months].reverse().map(month => (
                    <div key={month.yearMonth} className="fin-month-card fin-animate-in">
                      <div className="fin-month-header">
                        <span className="fin-month-label">{fmtMonth(month.yearMonth)}</span>
                        <span className="fin-month-total">{fmtBRL(month.total)}</span>
                      </div>
                      <div className="fin-month-types">
                        {month.byType.map(t => (
                          <div key={t.type} className="fin-month-type-row">
                            <span className="fin-type-dot" style={{background: TYPE_COLORS[t.type]}} />
                            <span className="fin-month-type-name">{TYPE_LABELS[t.type]}</span>
                            <span className="fin-month-type-val">{fmtBRL(t.totalReal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Reset modal ── */}
      {resetModal.show && (
        <div className="fin-modal-overlay" onClick={() => setResetModal(m => ({ ...m, show: false }))}>
          <div className="fin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="fin-modal-title">Fechar período</h3>
            <p className="fin-modal-body">
              Os lançamentos do período atual serão enviados para o histórico e a planilha será reiniciada.
            </p>
            {resetModal.hasConflict && (
              <label className="fin-modal-conflict">
                <input
                  type="checkbox"
                  checked={resetModal.confirmed}
                  onChange={e => setResetModal(m => ({ ...m, confirmed: e.target.checked }))}
                />
                <span>
                  Já existe histórico salvo para este período. Entendo que os dados existentes serão substituídos.
                </span>
              </label>
            )}
            <div className="fin-modal-footer">
              <button className="fin-btn fin-btn--ghost fin-btn--sm" onClick={() => setResetModal(m => ({ ...m, show: false }))}>
                Cancelar
              </button>
              <button
                className="fin-btn fin-btn--danger fin-btn--sm"
                onClick={confirmReset}
                disabled={resetModal.hasConflict && !resetModal.confirmed}
              >
                Fechar período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon }: { label: string; value: number|null; icon: string }) {
  return (
    <div className="fin-card fin-animate-in">
      <span className="fin-card-icon">{icon}</span>
      <div>
        <div className="fin-card-label">{label}</div>
        <div className="fin-card-value">{fmtBRL(value)}</div>
      </div>
    </div>
  )
}

interface ExpenseRowProps {
  exp: Expense
  editCell: {id:number; field:'title'|'estimated'|'real'|'type'} | null
  editCellVal: string
  onStartEdit: (id:number, field:'title'|'estimated'|'real'|'type', val:string) => void
  onEditChange: (v:string) => void
  onCommit: () => void
  onCancelEdit: () => void
  onMarkPaid: (exp:Expense) => void
  onDelete: (id:number) => void
}

function ExpenseRow({ exp, editCell, editCellVal, onStartEdit, onEditChange, onCommit, onCancelEdit, onMarkPaid, onDelete }: ExpenseRowProps) {
  const isEditingTitle = editCell?.id === exp.id && editCell.field === 'title'
  const isEditingEst   = editCell?.id === exp.id && editCell.field === 'estimated'
  const isEditingReal  = editCell?.id === exp.id && editCell.field === 'real'
  const isEditingType  = editCell?.id === exp.id && editCell.field === 'type'

  return (
    <tr className={`fin-row ${exp.recurring?'fin-row--recurring':''} fin-animate-row`}>
      <td className="fin-cell-title">
        {isEditingTitle ? (
          <InlineTextCell val={editCellVal} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
        ) : (
          <span className="fin-editable-cell" onClick={()=>onStartEdit(exp.id,'title',exp.title)} title="Clique para editar">
            {exp.title}
          </span>
        )}
      </td>
      <td>
        {isEditingEst ? (
          <InlineNumberCell value={exp.estimatedValue} editing={true} editVal={editCellVal}
            onStart={()=>{}} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
        ) : (
          <span className="fin-editable-cell" onClick={()=>onStartEdit(exp.id,'estimated',(exp.estimatedValue??'').toString())} title="Clique para editar">
            {fmtBRL(exp.estimatedValue)}
          </span>
        )}
      </td>
      <td className="fin-cell-real fin-td--center">
        <div className="fin-real-cell">
          {isEditingReal ? (
            <InlineNumberCell value={exp.realValue} editing={true} editVal={editCellVal}
              onStart={()=>{}} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
          ) : (
            <span className="fin-editable-cell fin-editable-cell--real" onClick={()=>onStartEdit(exp.id,'real',exp.realValue.toString())} title="Clique para editar">
              {fmtBRL(exp.realValue)}
            </span>
          )}
          {exp.estimatedValue != null && exp.realValue < exp.estimatedValue && (
            <button className="fin-pay-btn" onClick={()=>onMarkPaid(exp)} title="Marcar como pago (preencher valor estimado)">✓</button>
          )}
        </div>
      </td>
      <td className="fin-td--center">
        {isEditingType ? (
          <select
            className="fin-inline-select"
            autoFocus
            value={editCellVal}
            onChange={e=>onEditChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancelEdit() }}
          >
            {ALL_TYPES.filter(t=>t!=='INVESTMENT').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        ) : (
          <span className="fin-type-badge fin-editable-cell"
            style={{background:TYPE_COLORS[exp.type]+'22', color:TYPE_COLORS[exp.type]}}
            onClick={()=>onStartEdit(exp.id,'type',exp.type)}
            title="Clique para alterar"
          >
            {TYPE_LABELS[exp.type]}
          </span>
        )}
      </td>
      <td className="fin-td--center">
        <span className={`fin-status-badge fin-status-badge--${exp.status.toLowerCase()}`}>
          {STATUS_LABELS[exp.status]}
        </span>
      </td>
      <td>
        <button className="fin-del-btn" onClick={()=>onDelete(exp.id)} title="Remover">✕</button>
      </td>
    </tr>
  )
}

function InlineTextCell({ val, onChange, onCommit, onCancel }: {
  val: string; onChange:(v:string)=>void; onCommit:()=>void; onCancel:()=>void
}) {
  return (
    <input
      className="fin-inline-input"
      autoFocus
      value={val}
      onChange={e=>onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancel() }}
    />
  )
}

function InlineNumberCell({ value, editing, editVal, onStart, onChange, onCommit, onCancel }: {
  value: number|null; editing: boolean; editVal: string;
  onStart:()=>void; onChange:(v:string)=>void; onCommit:()=>void; onCancel:()=>void
}) {
  if (!editing) return (
    <span className="fin-editable-cell" onClick={onStart} title="Clique para editar">
      {fmtBRL(value)}
    </span>
  )
  return (
    <input
      className="fin-inline-input fin-inline-input--number"
      autoFocus
      type="number"
      step="0.01"
      value={editVal}
      onChange={e=>onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancel() }}
    />
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildPieData(expenses: Expense[]) {
  const map = new Map<ExpenseType, number>()
  for (const e of expenses) {
    const v = e.estimatedValue ?? 0
    if (v > 0) map.set(e.type, (map.get(e.type) ?? 0) + v)
  }
  return Array.from(map.entries()).map(([type, value]) => ({
    name: TYPE_LABELS[type], value, color: TYPE_COLORS[type],
  }))
}

function spentForType(expenses: Expense[], type: ExpenseType) {
  return expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.realValue, 0)
}

function buildMoM(months: MonthSummary[]) {
  if (months.length < 2) return null
  const curr = months[months.length - 1]
  const prev = months[months.length - 2]
  const totalDelta = curr.total - prev.total
  const totalPct = prev.total > 0 ? (totalDelta / prev.total) * 100 : null

  const types = new Set<ExpenseType>()
  curr.byType.forEach(t => types.add(t.type))
  prev.byType.forEach(t => types.add(t.type))
  const currMap = new Map(curr.byType.map(t => [t.type, t.totalReal]))
  const prevMap = new Map(prev.byType.map(t => [t.type, t.totalReal]))
  const movers = Array.from(types)
    .map(type => ({ type, delta: (currMap.get(type) ?? 0) - (prevMap.get(type) ?? 0) }))
    .filter(m => Math.abs(m.delta) > 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const estimated = curr.byType.reduce((s, t) => s + t.totalEstimated, 0)
  const accuracyPct = estimated > 0 ? (curr.total / estimated) * 100 : null
  return { curr, prev, totalDelta, totalPct, movers, estimated, accuracyPct }
}

function buildGroupedData(expenses: Expense[]) {
  const map = new Map<ExpenseType, {estimated: number; real: number}>()
  for (const e of expenses) {
    const cur = map.get(e.type) ?? {estimated: 0, real: 0}
    cur.estimated += e.estimatedValue ?? 0
    cur.real += e.realValue
    map.set(e.type, cur)
  }
  return Array.from(map.entries()).map(([type, vals]) => ({
    type: TYPE_LABELS[type],
    estimated: vals.estimated,
    real: vals.real,
  }))
}
