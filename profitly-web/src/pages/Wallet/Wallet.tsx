import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { AddPositionModal } from '../../components/AddPositionModal/AddPositionModal'
import { CreateWalletModal } from '../../components/CreateWalletModal/CreateWalletModal'
import { useWallets } from '../../hooks/useWallets'
import { useI18n } from '../../i18n/I18nContext'
import { api } from '../../lib/api'
import type { WalletSummary } from '../../types/WalletSummary'
import './Wallet.css'

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

const ASSET_COLORS = [
  '#378add','#22c55e','#f59e0b','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#64748b',
]

function buildEvolution(wallet: WalletSummary) {
  const allEntries = wallet.positions.flatMap(p =>
    p.entries.map(e => ({ date: e.date, value: e.quantity * e.paidPrice }))
  )
  allEntries.sort((a, b) => a.date.localeCompare(b.date))
  const byMonth: Record<string, number> = {}
  for (const e of allEntries) {
    const m = e.date.slice(0, 7)
    byMonth[m] = (byMonth[m] ?? 0) + e.value
  }
  let cum = 0
  return Object.keys(byMonth).sort().map(m => {
    cum += byMonth[m]
    return { month: fmtMonth(m), invested: parseFloat(cum.toFixed(2)) }
  })
}

// ── Dividend types & helpers ──────────────────────────────────────────────────
interface Dividend {
  id: string
  ticker: string
  totalAmount: number
  paymentDate: string
  type: string
  received: boolean
}

const DIVIDEND_TYPES = ['DIVIDENDO', 'JCP', 'RENDIMENTO', 'AMORTIZAÇÃO']
const DIVIDEND_TYPE_LABELS: Record<string, string> = {
  DIVIDENDO: 'Dividendo', JCP: 'JCP', RENDIMENTO: 'Rendimento', AMORTIZAÇÃO: 'Amortização',
}

function buildDividendEvolution(dividends: Dividend[]) {
  const byMonth: Record<string, number> = {}
  for (const d of dividends) {
    const m = d.paymentDate.slice(0, 7)
    byMonth[m] = (byMonth[m] ?? 0) + d.totalAmount
  }
  return Object.keys(byMonth).sort().map(m => ({ month: fmtMonth(m), amount: parseFloat(byMonth[m].toFixed(2)) }))
}

function buildDividendByTicker(dividends: Dividend[]) {
  const byTicker: Record<string, number> = {}
  for (const d of dividends) {
    byTicker[d.ticker] = (byTicker[d.ticker] ?? 0) + d.totalAmount
  }
  const total = Object.values(byTicker).reduce((a, b) => a + b, 0)
  return Object.entries(byTicker)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total > 0 ? value / total * 100 : 0 }))
}

function buildAssetTypes(wallet: WalletSummary) {
  const byType: Record<string, number> = {}
  for (const pos of wallet.positions) {
    const t = pos.assetType ?? 'Outros'
    byType[t] = (byType[t] ?? 0) + pos.currentValue
  }
  const total = Object.values(byType).reduce((a, b) => a + b, 0)
  return Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total * 100) : 0 }))
}

export function Wallet() {
  const { wallets, setWallets, loading, error } = useWallets()
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [walletView, setWalletView] = useState<'positions' | 'patrimonio' | 'proventos'>('positions')
  const [addPositionWalletId, setAddPositionWalletId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const activeWalletId = selectedId ?? wallets[0]?.id ?? null
  const activeWallet = wallets.find(w => w.id === activeWalletId) ?? null

  function handleWalletUpdate(updated: WalletSummary) {
    setWallets(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  function handleWalletCreated(created: WalletSummary) {
    setWallets(prev => [...prev, created])
    setSelectedId(created.id)
    setShowCreateModal(false)
  }

  async function handleDeleteWallet(walletId: string) {
    await api.delete(`/api/wallets/${walletId}`)
    setWallets(prev => {
      const next = prev.filter(w => w.id !== walletId)
      if (selectedId === walletId) setSelectedId(next[0]?.id ?? null)
      return next
    })
    setDeletingId(null)
  }

  if (loading) return (
    <div className="wallet-page">

      <div className="wallet-skeleton">
        <div className="skeleton-tabs" />
        <div className="skeleton-card" />
        <div className="skeleton-table" />
      </div>
    </div>
  )

  if (error) return (
    <div className="wallet-page">

      <div className="wallet-state wallet-state--error">Failed to load wallets: {error}</div>
    </div>
  )

  return (
    <div className="wallet-page">


      <div className="wallet-nav-row">
        <div className="wallet-tabs">
          {wallets.map(w => (
            <button
              key={w.id}
              className={`wallet-tab ${w.id === activeWalletId ? 'wallet-tab--active' : ''}`}
              onClick={() => setSelectedId(w.id)}
            >
              {w.name}
            </button>
          ))}
        </div>
        <button className="wallet-new-btn" onClick={() => setShowCreateModal(true)}>
          {t.wallet.newWallet}
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="wallet-empty">
          <p className="wallet-empty-text">{t.wallet.noWallets}</p>
          <button className="wallet-empty-btn" onClick={() => setShowCreateModal(true)}>
            {t.wallet.createFirst}
          </button>
        </div>
      ) : activeWallet && (
        <div className="wallet-section">
          <div className="wallet-section-header">
            <div className="wallet-view-tabs">
              {(['positions', 'patrimonio', 'proventos'] as const).map(v => (
                <button
                  key={v}
                  className={`wallet-view-tab ${walletView === v ? 'wallet-view-tab--active' : ''}`}
                  onClick={() => setWalletView(v)}
                >
                  {v === 'positions' ? 'Posições' : v === 'patrimonio' ? 'Patrimônio' : 'Proventos'}
                </button>
              ))}
            </div>
            <button className="wallet-delete-btn" onClick={() => setDeletingId(activeWallet.id)}>
              {t.wallet.deleteWallet}
            </button>
          </div>

          {walletView === 'positions' && (
            <>
              <WalletCard
                wallet={activeWallet}
                index={0}
                onAddPosition={() => setAddPositionWalletId(activeWallet.id)}
                onWalletUpdate={handleWalletUpdate}
              />
              <PositionTable
                walletId={activeWallet.id}
                positions={activeWallet.positions}
                onWalletUpdate={handleWalletUpdate}
              />
            </>
          )}
          {walletView === 'patrimonio' && <PatrimonioView wallet={activeWallet} />}
          {walletView === 'proventos' && <ProventosView walletId={activeWallet.id} wallet={activeWallet} />}
        </div>
      )}

      {deletingId && (() => {
        const name = wallets.find(w => w.id === deletingId)?.name ?? ''
        return (
          <div className="modal-backdrop" onClick={() => setDeletingId(null)}>
            <div className="modal modal--confirm" onClick={e => e.stopPropagation()}>
              <div className="modal-title">{t.confirm.deleteWallet}</div>
              <p className="confirm-text">{t.confirm.deleteWalletText(name)}</p>
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setDeletingId(null)}>
                  {t.confirm.cancel}
                </button>
                <button className="modal-btn-danger" onClick={() => handleDeleteWallet(deletingId)}>
                  {t.confirm.delete}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {showCreateModal && (
        <CreateWalletModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleWalletCreated}
        />
      )}

      {addPositionWalletId && activeWallet && (
        <AddPositionModal
          walletId={activeWallet.id}
          walletName={activeWallet.name}
          onClose={() => setAddPositionWalletId(null)}
          onSuccess={updated => { handleWalletUpdate(updated); setAddPositionWalletId(null) }}
        />
      )}
    </div>
  )
}

// ── Patrimônio view ───────────────────────────────────────────────────────────
function PatrimonioView({ wallet }: { wallet: WalletSummary }) {
  const up = wallet.profitOrLoss >= 0
  const evolution = buildEvolution(wallet)
  const assetTypes = buildAssetTypes(wallet)

  return (
    <div className="pat-wrap">
      {/* Summary cards */}
      <div className="pat-cards">
        <div className="pat-card">
          <span className="pat-card-label">Total Investido</span>
          <span className="pat-card-value">{fmtBRL(wallet.totalInvested)}</span>
        </div>
        <div className="pat-card">
          <span className="pat-card-label">Valor Atual</span>
          <span className="pat-card-value">{fmtBRL(wallet.currentValue)}</span>
        </div>
        <div className="pat-card">
          <span className="pat-card-label">Rendimento</span>
          <span className={`pat-card-value ${up ? 'pat-up' : 'pat-down'}`}>
            {up ? '+' : ''}{fmtBRL(wallet.profitOrLoss)}
          </span>
        </div>
        <div className="pat-card">
          <span className="pat-card-label">Retorno</span>
          <span className={`pat-card-badge ${up ? 'pat-card-badge--up' : 'pat-card-badge--down'}`}>
            {up ? '▲' : '▼'} {up ? '+' : ''}{wallet.profitOrLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Evolution line chart */}
      {evolution.length > 0 && (
        <div className="pat-chart-section">
          <h3 className="pat-section-title">Evolução do Patrimônio</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolution} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip formatter={(v: number) => [fmtBRL(v), 'Total Investido']} />
              <Line
                type="monotone"
                dataKey="invested"
                stroke="#378add"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#378add' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Asset type breakdown */}
      {assetTypes.length > 0 && (
        <div className="pat-chart-section">
          <h3 className="pat-section-title">Consolidação por tipo de ativo</h3>
          <div className="pat-breakdown">
            <ResponsiveContainer width={240} height={240}>
              <PieChart>
                <Pie
                  data={assetTypes}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {assetTypes.map((_, i) => (
                    <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pat-legend">
              {assetTypes.map((t, i) => (
                <div key={t.name} className="pat-legend-row">
                  <span className="pat-legend-dot" style={{ background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                  <span className="pat-legend-name">{t.name}</span>
                  <span className="pat-legend-value">{fmtBRL(t.value)}</span>
                  <span className="pat-legend-pct">{t.pct.toFixed(1)}%</span>
                  <div className="pat-legend-bar-wrap">
                    <div className="pat-legend-bar" style={{ width: `${t.pct}%`, background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Proventos view ────────────────────────────────────────────────────────────
function ProventosView({ walletId, wallet }: { walletId: string; wallet: WalletSummary }) {
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ticker: '', totalAmount: '', paymentDate: '', type: 'DIVIDENDO', received: true })

  useEffect(() => { load() }, [walletId])

  async function load() {
    const res = await api.get<Dividend[]>(`/api/wallets/${walletId}/dividends`)
    setDividends(res.data)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await api.post(`/api/wallets/${walletId}/dividends`, {
      ticker: form.ticker,
      totalAmount: parseFloat(form.totalAmount),
      paymentDate: form.paymentDate,
      type: form.type,
      received: form.received,
    })
    setShowAdd(false)
    setForm({ ticker: '', totalAmount: '', paymentDate: '', type: 'DIVIDENDO', received: true })
    await load()
  }

  async function handleToggle(id: string) {
    await api.patch(`/api/wallets/${walletId}/dividends/${id}/toggle`)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este provento?')) return
    await api.delete(`/api/wallets/${walletId}/dividends/${id}`)
    await load()
  }

  const received = dividends.filter(d => d.received)
  const pending = dividends.filter(d => !d.received)
  const totalReceived = received.reduce((s, d) => s + d.totalAmount, 0)
  const totalPending = pending.reduce((s, d) => s + d.totalAmount, 0)
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 7)
  const last12 = received.filter(d => d.paymentDate.slice(0, 7) >= twelveMonthsAgo)
  const total12 = last12.reduce((s, d) => s + d.totalAmount, 0)
  const monthlyAvg = total12 / 12

  const evolution = buildDividendEvolution(received)
  const byTicker = buildDividendByTicker(received)

  return (
    <div className="prov-wrap">
      {/* Summary */}
      <div className="prov-summary">
        <div className="prov-summary-left">
          <div className="prov-summary-label">Média mensal (12m)</div>
          <div className="prov-summary-main">{fmtBRL(monthlyAvg)}</div>
          <div className="prov-summary-sub">Total 12 meses: <strong>{fmtBRL(total12)}</strong></div>
          <div className="prov-summary-sub">Total recebido: <strong>{fmtBRL(totalReceived)}</strong></div>
          <div className="prov-summary-sub prov-pending">A receber: <strong>{fmtBRL(totalPending)}</strong></div>
          {byTicker.length > 0 && (
            <div className="prov-donut-wrap">
              <div className="prov-donut-title">Distribuição por ativo</div>
              <div className="prov-donut-row">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={byTicker} dataKey="value" nameKey="name" innerRadius={38} outerRadius={66} paddingAngle={2}>
                      {byTicker.map((_, i) => <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="prov-donut-legend">
                  {byTicker.slice(0, 5).map((t, i) => (
                    <div key={t.name} className="prov-donut-row-item">
                      <span className="pat-legend-dot" style={{ background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                      <span>{t.name}</span>
                      <span className="prov-pct">{t.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="prov-chart-wrap">
          <div className="prov-chart-header">
            <span className="pat-section-title">Evolução de Proventos</span>
            <button className="prov-add-btn" onClick={() => setShowAdd(v => !v)}>+ Lançar</button>
          </div>
          {evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={evolution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `R$${v.toFixed(0)}`} width={48} />
                <Tooltip formatter={(v: number) => [fmtBRL(v), 'Recebido']} />
                <Bar dataKey="amount" fill="#378add" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="prov-empty">Nenhum provento recebido ainda.</div>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form className="prov-form" onSubmit={handleAdd}>
          <h4 className="prov-form-title">Lançar provento</h4>
          <div className="prov-form-grid">
            <div className="prov-field">
              <label>Ativo</label>
              <input list="prov-tickers" className="prov-input" placeholder="BTHF11"
                value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required />
              <datalist id="prov-tickers">
                {wallet.positions.map(p => <option key={p.ticker} value={p.ticker} />)}
              </datalist>
            </div>
            <div className="prov-field">
              <label>Valor total (R$)</label>
              <input className="prov-input" type="number" step="0.01" placeholder="0,00"
                value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} required />
            </div>
            <div className="prov-field">
              <label>Data de pagamento</label>
              <input className="prov-input" type="date"
                value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} required />
            </div>
            <div className="prov-field">
              <label>Tipo</label>
              <select className="prov-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {DIVIDEND_TYPES.map(t => <option key={t} value={t}>{DIVIDEND_TYPE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          </div>
          <label className="prov-check">
            <input type="checkbox" checked={form.received} onChange={e => setForm(f => ({ ...f, received: e.target.checked }))} />
            Já recebido
          </label>
          <div className="prov-form-footer">
            <button type="button" className="prov-btn-cancel" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button type="submit" className="prov-btn-save">Salvar</button>
          </div>
        </form>
      )}

      {/* List */}
      {dividends.length > 0 && (
        <div className="prov-table-wrap">
          <table className="prov-table">
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Tipo</th>
                <th>Data</th>
                <th className="prov-right">Valor</th>
                <th className="prov-center">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dividends.map(d => (
                <tr key={d.id}>
                  <td><span className="prov-ticker">{d.ticker}</span></td>
                  <td><span className="prov-type-badge">{DIVIDEND_TYPE_LABELS[d.type] ?? d.type}</span></td>
                  <td className="prov-date">{new Date(d.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="prov-right prov-amount">{fmtBRL(d.totalAmount)}</td>
                  <td className="prov-center">
                    <button className={`prov-status-btn ${d.received ? 'prov-status-btn--received' : 'prov-status-btn--pending'}`}
                      onClick={() => handleToggle(d.id)}>
                      {d.received ? 'Recebido' : 'A receber'}
                    </button>
                  </td>
                  <td>
                    <button className="prov-del-btn" onClick={() => handleDelete(d.id)}>✕</button>
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
