import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Header } from '../../components/Header/Header'
import { api } from '../../lib/api'
import './Finance.css'

// ── Types ────────────────────────────────────────────────────────────────────
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
}

interface CurrentPeriod {
  expenses: Expense[]
  netSalary: number | null
  investmentTarget: number | null
  totalReal: number
  totalEstimated: number
  balance: number
  resetDay: number
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
const ALL_STATUSES = ['PAID','PARTIAL','PENDING','OVERRUN'] as ExpenseStatus[]

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
  const navigate = useNavigate()
  const [tab, setTab] = useState<'current'|'history'>('current')
  const [period, setPeriod] = useState<CurrentPeriod | null>(null)
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [settings, setSettings] = useState<Settings>({ resetDay: 10, netSalary: null, investmentTarget: null })
  const [loading, setLoading] = useState(true)

  // Add expense form
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addEstimated, setAddEstimated] = useState('')
  const [addReal, setAddReal] = useState('')
  const [addType, setAddType] = useState<ExpenseType>('LEISURE')
  const [addStatus, setAddStatus] = useState<ExpenseStatus>('PENDING')

  // Quick launch
  const [qlTitle, setQlTitle] = useState('')
  const [qlValue, setQlValue] = useState('')
  const [qlLoading, setQlLoading] = useState(false)

  // Settings form
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSalary, setSettingsSalary] = useState('')
  const [settingsInvestment, setSettingsInvestment] = useState('')
  const [settingsResetDay, setSettingsResetDay] = useState('10')

  // History filter
  const [histFrom, setHistFrom] = useState('')
  const [histTo, setHistTo] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        api.get<CurrentPeriod>('/api/finance/current'),
        api.get<Settings>('/api/finance/settings'),
      ])
      setPeriod(pRes.data)
      setSettings(sRes.data)
      setSettingsSalary(sRes.data.netSalary?.toString() ?? '')
      setSettingsInvestment(sRes.data.investmentTarget?.toString() ?? '')
      setSettingsResetDay(sRes.data.resetDay.toString())
    } catch { navigate('/login') }
    finally { setLoading(false) }
  }

  async function loadHistory() {
    const params: Record<string, string> = {}
    if (histFrom) params.from = histFrom
    if (histTo) params.to = histTo
    const res = await api.get<HistoryData>('/api/finance/history', { params })
    setHistory(res.data)
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, histFrom, histTo])

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/finance/expenses', {
      title: addTitle,
      estimatedValue: addEstimated ? parseFloat(addEstimated) : null,
      realValue: addReal ? parseFloat(addReal) : 0,
      status: addStatus,
      type: addType,
    })
    setShowAdd(false)
    setAddTitle(''); setAddEstimated(''); setAddReal('')
    await loadAll()
  }

  async function handleQuickLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!qlTitle || !qlValue) return
    setQlLoading(true)
    try {
      await api.post('/api/finance/expenses/quick-launch', {
        title: qlTitle, value: parseFloat(qlValue),
      })
      setQlValue('')
      await loadAll()
    } catch { alert('Lançamento não encontrado') }
    finally { setQlLoading(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remover este lançamento?')) return
    await api.delete(`/api/finance/expenses/${id}`)
    await loadAll()
  }

  async function handleStatusChange(expense: Expense, status: ExpenseStatus) {
    await api.patch(`/api/finance/expenses/${expense.id}`, { status })
    await loadAll()
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    await api.put('/api/finance/settings', {
      resetDay: parseInt(settingsResetDay),
      netSalary: settingsSalary ? parseFloat(settingsSalary) : null,
      investmentTarget: settingsInvestment ? parseFloat(settingsInvestment) : null,
    })
    setShowSettings(false)
    await loadAll()
  }

  async function handleReset() {
    if (!confirm('Resetar o período atual? Os dados irão para o histórico.')) return
    await api.post('/api/finance/reset')
    await loadAll()
  }

  if (loading) return (
    <div className="fin-page">
      <Header />
      <div className="fin-loading"><span className="fin-spinner" />Carregando...</div>
    </div>
  )

  const expensesByType = period ? [...new Map(
    period.expenses.map(e => [e.type, e])
  ).keys()] : []

  return (
    <div className="fin-page">
      <Header />

      <div className="fin-container">
        {/* ── Tabs ── */}
        <div className="fin-tabs">
          <button className={`fin-tab ${tab==='current'?'fin-tab--active':''}`} onClick={()=>setTab('current')}>
            Período Atual
          </button>
          <button className={`fin-tab ${tab==='history'?'fin-tab--active':''}`} onClick={()=>setTab('history')}>
            Histórico
          </button>
          <div className="fin-tabs-actions">
            <button className="fin-btn fin-btn--ghost" onClick={()=>setShowSettings(v=>!v)}>⚙ Configurações</button>
            <button className="fin-btn fin-btn--danger" onClick={handleReset}>↺ Resetar período</button>
          </div>
        </div>

        {/* ── Settings Panel ── */}
        {showSettings && (
          <div className="fin-settings-panel fin-animate-in">
            <form className="fin-settings-form" onSubmit={handleSaveSettings}>
              <h3 className="fin-settings-title">Configurações do período</h3>
              <div className="fin-settings-row">
                <div className="fin-field">
                  <label>Salário líquido</label>
                  <input type="number" step="0.01" value={settingsSalary}
                    onChange={e=>setSettingsSalary(e.target.value)} placeholder="R$ 0,00" />
                </div>
                <div className="fin-field">
                  <label>Meta de investimento</label>
                  <input type="number" step="0.01" value={settingsInvestment}
                    onChange={e=>setSettingsInvestment(e.target.value)} placeholder="R$ 0,00" />
                </div>
                <div className="fin-field">
                  <label>Dia de reset (1-28)</label>
                  <input type="number" min="1" max="28" value={settingsResetDay}
                    onChange={e=>setSettingsResetDay(e.target.value)} />
                </div>
              </div>
              <div className="fin-settings-footer">
                <button type="button" className="fin-btn fin-btn--ghost" onClick={()=>setShowSettings(false)}>Cancelar</button>
                <button type="submit" className="fin-btn fin-btn--primary">Salvar</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'current' && period && (
          <>
            {/* ── Summary Cards ── */}
            <div className="fin-cards">
              <SummaryCard label="Salário Líquido" value={period.netSalary} color="blue" icon="💰" />
              <SummaryCard label="Investimento" value={period.investmentTarget} color="green" icon="📈" />
              <SummaryCard label="Total Gasto" value={period.totalReal} color="orange" icon="💳" />
              <SummaryCard
                label="Saldo"
                value={period.balance}
                color={period.balance >= 0 ? 'green' : 'red'}
                icon={period.balance >= 0 ? '✅' : '⚠️'}
              />
            </div>

            {/* ── Quick Launch ── */}
            <div className="fin-quick fin-animate-in">
              <h3 className="fin-section-title">⚡ Lançamento Rápido</h3>
              <form className="fin-quick-form" onSubmit={handleQuickLaunch}>
                <select
                  className="fin-input"
                  value={qlTitle}
                  onChange={e=>setQlTitle(e.target.value)}
                  required
                >
                  <option value="">Selecione um lançamento</option>
                  {period.expenses.map(e => (
                    <option key={e.id} value={e.title}>{e.title}</option>
                  ))}
                </select>
                <input
                  className="fin-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Valor (R$)"
                  value={qlValue}
                  onChange={e=>setQlValue(e.target.value)}
                  required
                />
                <button className="fin-btn fin-btn--primary" type="submit" disabled={qlLoading}>
                  {qlLoading ? '...' : 'Lançar'}
                </button>
              </form>
            </div>

            {/* ── Expense Table ── */}
            <div className="fin-table-section fin-animate-in">
              <div className="fin-table-header">
                <h3 className="fin-section-title">Lançamentos do período</h3>
                <button className="fin-btn fin-btn--primary" onClick={()=>setShowAdd(v=>!v)}>
                  {showAdd ? '✕ Fechar' : '+ Novo lançamento'}
                </button>
              </div>

              {showAdd && (
                <form className="fin-add-form fin-animate-in" onSubmit={handleAddExpense}>
                  <div className="fin-add-row">
                    <input className="fin-input" placeholder="Título" value={addTitle}
                      onChange={e=>setAddTitle(e.target.value)} required />
                    <input className="fin-input" type="number" step="0.01" placeholder="Estimado (R$)"
                      value={addEstimated} onChange={e=>setAddEstimated(e.target.value)} />
                    <input className="fin-input" type="number" step="0.01" placeholder="Real (R$)"
                      value={addReal} onChange={e=>setAddReal(e.target.value)} />
                    <select className="fin-input" value={addType} onChange={e=>setAddType(e.target.value as ExpenseType)}>
                      {ALL_TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                    <select className="fin-input" value={addStatus} onChange={e=>setAddStatus(e.target.value as ExpenseStatus)}>
                      {ALL_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <button className="fin-btn fin-btn--primary" type="submit">Adicionar</button>
                  </div>
                </form>
              )}

              <div className="fin-table-wrap">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Estimado</th>
                      <th>Real</th>
                      <th>Tipo</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.expenses.length === 0 && (
                      <tr><td colSpan={6} className="fin-empty">Nenhum lançamento ainda</td></tr>
                    )}
                    {period.expenses.map(exp => (
                      <tr key={exp.id} className="fin-row fin-animate-row">
                        <td className="fin-cell-title">{exp.title}</td>
                        <td>{fmtBRL(exp.estimatedValue)}</td>
                        <td className="fin-cell-real">{fmtBRL(exp.realValue)}</td>
                        <td>
                          <span className="fin-type-badge" style={{background: TYPE_COLORS[exp.type] + '22', color: TYPE_COLORS[exp.type]}}>
                            {TYPE_LABELS[exp.type]}
                          </span>
                        </td>
                        <td>
                          <select
                            className={`fin-status fin-status--${exp.status.toLowerCase()}`}
                            value={exp.status}
                            onChange={e=>handleStatusChange(exp, e.target.value as ExpenseStatus)}
                          >
                            {ALL_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                        </td>
                        <td>
                          <button className="fin-del-btn" onClick={()=>handleDelete(exp.id)} title="Remover">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {period.expenses.length > 0 && (
                    <tfoot>
                      <tr className="fin-total-row">
                        <td>Total</td>
                        <td>{fmtBRL(period.totalEstimated)}</td>
                        <td>{fmtBRL(period.totalReal)}</td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ── Period Chart ── */}
            {period.expenses.length > 0 && (
              <div className="fin-chart-section fin-animate-in">
                <h3 className="fin-section-title">Distribuição por categoria</h3>
                <div className="fin-charts-row">
                  <ResponsiveContainer width="60%" height={260}>
                    <BarChart data={period.expenses.reduce((acc, e) => {
                      const found = acc.find(a => a.type === e.type)
                      if (found) found.real += e.realValue
                      else acc.push({ type: TYPE_LABELS[e.type], real: e.realValue, color: TYPE_COLORS[e.type] })
                      return acc
                    }, [] as {type:string;real:number;color:string}[])}>
                      <XAxis dataKey="type" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:11}} />
                      <Tooltip formatter={(v:number) => fmtBRL(v)} />
                      <Bar dataKey="real" radius={[4,4,0,0]}>
                        {period.expenses.reduce((acc, e) => {
                          if (!acc.find(a => a.type === e.type)) acc.push(e)
                          return acc
                        }, [] as Expense[]).map((e, i) => (
                          <Cell key={i} fill={TYPE_COLORS[e.type]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="40%" height={260}>
                    <PieChart>
                      <Pie
                        data={period.expenses.reduce((acc, e) => {
                          const found = acc.find(a => a.name === TYPE_LABELS[e.type])
                          if (found) found.value += e.realValue
                          else acc.push({ name: TYPE_LABELS[e.type], value: e.realValue, color: TYPE_COLORS[e.type] })
                          return acc
                        }, [] as {name:string;value:number;color:string}[])}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {period.expenses.reduce((acc, e) => {
                          if (!acc.find(a => a.type === e.type)) acc.push(e)
                          return acc
                        }, [] as Expense[]).map((e, i) => (
                          <Cell key={i} fill={TYPE_COLORS[e.type]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

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
                <p>Nenhum histórico disponível ainda.<br />O histórico é gerado automaticamente ao resetar o período.</p>
              </div>
            ) : (
              <>
                {/* ── History Bar Chart ── */}
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

                {/* ── Stacked by type ── */}
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

                {/* ── Month cards ── */}
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
    </div>
  )
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number|null; color: string; icon: string }) {
  return (
    <div className={`fin-card fin-card--${color} fin-animate-in`}>
      <span className="fin-card-icon">{icon}</span>
      <div>
        <div className="fin-card-label">{label}</div>
        <div className="fin-card-value">{fmtBRL(value)}</div>
      </div>
    </div>
  )
}
