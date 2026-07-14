import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import type {
  ExpenseType, Expense, CurrentPeriod, RecurringExpense, RecurringIncome,
  Settings, HistoryData,
} from './types'
import { INVEST_PCTS } from './constants'
import { CurrentPeriodTab } from './tabs/CurrentPeriodTab'
import { HistoryTab } from './tabs/HistoryTab'
import { RecurringTab } from './tabs/RecurringTab'
import { HelpTip } from './components/HelpTip'
import './Finance.css'

// ── Main Component ────────────────────────────────────────────────────────────
export function Finance() {
  const [tab, setTab] = useState<'current'|'recurring'|'history'>('current')
  const [period, setPeriod] = useState<CurrentPeriod | null>(null)
  const [recurringList, setRecurringList] = useState<RecurringExpense[]>([])
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [settings, setSettings] = useState<Settings>({ resetDay: 10, netSalary: null, investmentTarget: null, investmentAuto: true })
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
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(null)

  // Recurring incomes
  const [recurringIncomeList, setRecurringIncomeList] = useState<RecurringIncome[]>([])
  const [showAddRecIncome, setShowAddRecIncome] = useState(false)
  const [recIncDesc, setRecIncDesc] = useState('')
  const [recIncAmount, setRecIncAmount] = useState('')
  const [recIncDueDay, setRecIncDueDay] = useState('')
  const [editingRecIncomeId, setEditingRecIncomeId] = useState<number | null>(null)

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
      setSalaryInput(sRes.data.netSalary?.toString() ?? '')
    } catch {
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
    setSalaryInput(res.data.netSalary?.toString() ?? '')
  }

  async function loadHistory() {
    const params: Record<string, string> = {}
    if (histFrom) params.from = histFrom
    if (histTo) params.to = histTo
    const res = await api.get<HistoryData>('/api/finance/history', { params })
    setHistory(res.data)
  }

  async function handleDeleteHistoryMonth(yearMonth: string) {
    await api.delete(`/api/finance/history/${yearMonth}`)
    await loadHistory()
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
      investmentAuto: settings.investmentAuto,
    })
    await Promise.all([refreshSettings(), refreshPeriod()])
  }

  async function handleSetInvestmentAuto(auto: boolean) {
    await api.put('/api/finance/settings', {
      resetDay: settings.resetDay,
      netSalary: settings.netSalary,
      investmentTarget: settings.investmentTarget,
      investmentAuto: auto,
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

  function resetRecurringForm() {
    setRecTitle(''); setRecEstimated(''); setRecDueDay(''); setRecVariable(false)
    setRecType('HOME'); setEditingRecurringId(null); setShowAddRecurring(false)
  }

  function startEditRecurring(r: RecurringExpense) {
    setRecTitle(r.title)
    setRecEstimated(r.estimatedValue != null ? r.estimatedValue.toString() : '')
    setRecType(r.type)
    setRecDueDay(r.dueDay != null ? r.dueDay.toString() : '')
    setRecVariable(r.variable)
    setEditingRecurringId(r.id)
    setShowAddRecurring(true)
  }

  function toggleRecurringForm() {
    if (showAddRecurring) resetRecurringForm()
    else {
      setEditingRecurringId(null)
      setRecTitle(''); setRecEstimated(''); setRecDueDay(''); setRecVariable(false); setRecType('HOME')
      setShowAddRecurring(true)
    }
  }

  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      title: recTitle,
      estimatedValue: recEstimated ? parseFloat(recEstimated) : null,
      type: recType,
      dueDay: recDueDay ? parseInt(recDueDay) : null,
      variable: recVariable,
    }
    if (editingRecurringId != null) await api.put(`/api/finance/recurring/${editingRecurringId}`, body)
    else await api.post('/api/finance/recurring', body)
    resetRecurringForm()
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleDeleteRecurring(id: number) {
    if (!confirm('Remover gasto recorrente?')) return
    await api.delete(`/api/finance/recurring/${id}`)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  function resetRecIncomeForm() {
    setRecIncDesc(''); setRecIncAmount(''); setRecIncDueDay('')
    setEditingRecIncomeId(null); setShowAddRecIncome(false)
  }

  function startEditRecIncome(r: RecurringIncome) {
    setRecIncDesc(r.description)
    setRecIncAmount(r.amount.toString())
    setRecIncDueDay(r.dueDay != null ? r.dueDay.toString() : '')
    setEditingRecIncomeId(r.id)
    setShowAddRecIncome(true)
  }

  function toggleRecIncomeForm() {
    if (showAddRecIncome) resetRecIncomeForm()
    else {
      setEditingRecIncomeId(null)
      setRecIncDesc(''); setRecIncAmount(''); setRecIncDueDay('')
      setShowAddRecIncome(true)
    }
  }

  async function handleAddRecIncome(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      description: recIncDesc,
      amount: parseFloat(recIncAmount),
      dueDay: recIncDueDay ? parseInt(recIncDueDay) : null,
    }
    if (editingRecIncomeId != null) await api.put(`/api/finance/recurring-income/${editingRecIncomeId}`, body)
    else await api.post('/api/finance/recurring-income', body)
    resetRecIncomeForm()
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function handleDeleteRecIncome(id: number) {
    if (!confirm('Remover renda recorrente?')) return
    await api.delete(`/api/finance/recurring-income/${id}`)
    await Promise.all([loadRecurring(), refreshPeriod()])
  }

  async function downloadCsv(url: string, filename: string) {
    const res = await api.get(url, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post<{ imported: number }>('/api/finance/import/expenses', form)
      alert(`${data.imported} lançamento(s) importado(s).`)
    } catch {
      alert('Não foi possível importar o CSV. Verifique o formato (titulo,tipo,estimado,real).')
    }
    e.target.value = ''
    await refreshPeriod()
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

  return (
    <div className="fin-page">
      <div className="page-container fin-container">
        {/* ── Page header ── */}
        <div className="fin-page-header fin-animate-in">
          <h1 className="fin-page-title">Finanças Pessoais</h1>
          <p className="fin-page-subtitle">
            Acompanhe suas entradas e gastos do mês, configure o que se repete todo período e consulte o histórico de meses fechados.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="fin-tabs">
          <div className="fin-tabs-group">
            <button className={`fin-tab ${tab==='current'?'fin-tab--active':''}`} onClick={()=>setTab('current')}>
              <span className="fin-tab-icon">📅</span> Período Atual
            </button>
            <button className={`fin-tab ${tab==='recurring'?'fin-tab--active':''}`} onClick={()=>setTab('recurring')}>
              <span className="fin-tab-icon">🔁</span> Recorrentes
            </button>
            <button className={`fin-tab ${tab==='history'?'fin-tab--active':''}`} onClick={()=>setTab('history')}>
              <span className="fin-tab-icon">📊</span> Histórico
            </button>
          </div>
          <div className="fin-tabs-actions">
            <div className="fin-close-period-group">
              <button className="fin-btn--close-period" onClick={handleReset}>
                <span className="fin-btn--close-period-icon">🔒</span> Fechar período
              </button>
              <HelpTip inline text="Encerra o período atual: os lançamentos de hoje são enviados para o Histórico e a tela de Período Atual reinicia zerada. Os gastos e rendas recorrentes são recriados automaticamente no novo período. Use isso quando o mês terminar." />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'current' && period && (
          <CurrentPeriodTab
            period={period}
            editingSalary={editingSalary} setEditingSalary={setEditingSalary}
            salaryInput={salaryInput} setSalaryInput={setSalaryInput}
            salaryRef={salaryRef} onSaveSalary={handleSaveSalary}
            showAddIncome={showAddIncome} setShowAddIncome={setShowAddIncome}
            incomeDesc={incomeDesc} setIncomeDesc={setIncomeDesc}
            incomeAmount={incomeAmount} setIncomeAmount={setIncomeAmount}
            onAddIncome={handleAddIncome} onDeleteIncome={handleDeleteIncome}
            showAddLimit={showAddLimit} setShowAddLimit={setShowAddLimit}
            limitType={limitType} setLimitType={setLimitType}
            limitValue={limitValue} setLimitValue={setLimitValue}
            onSaveLimit={handleSaveLimit} onDeleteLimit={handleDeleteLimit}
            showAdd={showAdd} setShowAdd={setShowAdd}
            addTitle={addTitle} setAddTitle={setAddTitle}
            addReal={addReal} setAddReal={setAddReal}
            addType={addType} setAddType={setAddType}
            onAddExpense={handleAddExpense}
            onExport={downloadCsv} onImport={handleImportCsv}
            editCell={editCell} editCellVal={editCellVal}
            onStartEdit={startEdit} onEditChange={setEditCellVal}
            onCommit={commitEdit} onCancelEdit={()=>setEditCell(null)}
            onMarkPaid={handleMarkPaid} onDelete={handleDelete}
            investPct={investPct} onInvestPct={handleInvestPct}
            investManual={investManual} setInvestManual={setInvestManual}
            onInvestManual={handleInvestManual}
            onSetInvestmentAuto={handleSetInvestmentAuto}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'recurring' && (
          <RecurringTab
            recurringList={recurringList}
            recurringIncomeList={recurringIncomeList}
            showAddRecurring={showAddRecurring}
            onToggleRecurringForm={toggleRecurringForm}
            editingRecurringId={editingRecurringId}
            onStartEditRecurring={startEditRecurring}
            recTitle={recTitle} setRecTitle={setRecTitle}
            recEstimated={recEstimated} setRecEstimated={setRecEstimated}
            recType={recType} setRecType={setRecType}
            recDueDay={recDueDay} setRecDueDay={setRecDueDay}
            recVariable={recVariable} setRecVariable={setRecVariable}
            onAddRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            showAddRecIncome={showAddRecIncome} onToggleRecIncomeForm={toggleRecIncomeForm}
            editingRecIncomeId={editingRecIncomeId} onStartEditRecIncome={startEditRecIncome}
            recIncDesc={recIncDesc} setRecIncDesc={setRecIncDesc}
            recIncAmount={recIncAmount} setRecIncAmount={setRecIncAmount}
            recIncDueDay={recIncDueDay} setRecIncDueDay={setRecIncDueDay}
            onAddRecIncome={handleAddRecIncome}
            onDeleteRecIncome={handleDeleteRecIncome}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <HistoryTab
            history={history}
            histFrom={histFrom}
            histTo={histTo}
            onHistFromChange={setHistFrom}
            onHistToChange={setHistTo}
            onExport={downloadCsv}
            onDeleteMonth={handleDeleteHistoryMonth}
          />
        )}
      </div>

      {/* ── Reset modal ── */}
      {resetModal.show && (
        <div className="fin-modal-overlay" onClick={() => setResetModal(m => ({ ...m, show: false }))}>
          <div className="fin-modal" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-icon">🔒</div>
            <h3 className="fin-modal-title">Fechar período atual</h3>
            <p className="fin-modal-body">
              Isso encerra o mês corrente e prepara tudo para o próximo. Veja o que vai acontecer:
            </p>
            <ul className="fin-modal-steps">
              <li><span>📤</span> Os lançamentos e o saldo deste período vão para o <strong>Histórico</strong>.</li>
              <li><span>🧹</span> A tela de <strong>Período Atual</strong> reinicia zerada para os novos gastos.</li>
              <li><span>🔁</span> Gastos e rendas <strong>recorrentes</strong> são recriados automaticamente no novo período.</li>
            </ul>
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


