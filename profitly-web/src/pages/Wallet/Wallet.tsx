import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { AddPositionModal } from '../../components/AddPositionModal/AddPositionModal'
import { CreateWalletModal } from '../../components/CreateWalletModal/CreateWalletModal'
import { HelpTip } from '../Finance/components/HelpTip'
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

// Axis labels: R$950 / R$1,5k / R$12k — one decimal below 10k so close ticks don't collide
function fmtAxisBRL(v: number) {
  if (Math.abs(v) < 1000) return `R$${v.toFixed(0)}`
  const k = v / 1000
  const label = Math.abs(k) < 10 ? k.toFixed(1).replace('.', ',').replace(',0', '') : k.toFixed(0)
  return `R$${label}k`
}

const CHART_TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
} as const

const ASSET_COLORS = [
  '#378add','#22c55e','#f59e0b','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#64748b',
  '#84cc16','#14b8a6','#a855f7','#eab308',
]

interface EvolutionPoint {
  month: string
  invested: number
  marketValue: number
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
  const tw = t.walletView
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [walletView, setWalletView] = useState<'positions' | 'patrimonio' | 'proventos'>('positions')
  const [addPositionWalletId, setAddPositionWalletId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
    setDeleteBusy(true)
    setActionError(null)
    try {
      await api.delete(`/api/wallets/${walletId}`)
      setWallets(prev => {
        const next = prev.filter(w => w.id !== walletId)
        if (selectedId === walletId) setSelectedId(next[0]?.id ?? null)
        return next
      })
      setDeletingId(null)
    } catch {
      setActionError(tw.actionError)
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) return (
    <div className="page-container wallet-page">
      <div className="wallet-skeleton">
        <div className="skeleton-tabs" />
        <div className="skeleton-card" />
        <div className="skeleton-table" />
      </div>
    </div>
  )

  if (error) return (
    <div className="page-container wallet-page">
      <div className="wallet-state wallet-state--error">{tw.loadError}</div>
    </div>
  )

  return (
    <div className="page-container wallet-page">

      {/* ── Wallet selector dropdown ── */}
      <div className="wdd-wrap">
        <button
          className="wdd-trigger"
          onClick={() => setDropdownOpen(v => !v)}
          aria-expanded={dropdownOpen}
        >
          <span className="wdd-trigger-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zM4 11a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
            </svg>
          </span>
          <span className="wdd-trigger-name">{activeWallet?.name ?? tw.walletsFallback}</span>
          <span className={`wdd-chevron ${dropdownOpen ? 'wdd-chevron--open' : ''}`}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="wdd-backdrop" onClick={() => setDropdownOpen(false)} />
            <div className="wdd-menu">
              <div className="wdd-menu-label">{tw.myWallets}</div>
              {wallets.map(w => (
                <div
                  key={w.id}
                  className={`wdd-item ${w.id === activeWalletId ? 'wdd-item--active' : ''}`}
                  onClick={() => { setSelectedId(w.id); setDropdownOpen(false) }}
                >
                  <span className="wdd-item-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zM4 11a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
                    </svg>
                  </span>
                  <span className="wdd-item-name">{w.name}</span>
                  {w.id === activeWalletId && (
                    <span className="wdd-item-check">✓</span>
                  )}
                  <button
                    className="wdd-item-del"
                    title={t.wallet.deleteWallet}
                    onClick={e => { e.stopPropagation(); setDropdownOpen(false); setDeletingId(w.id) }}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}

              <div className="wdd-divider" />

              <button
                className="wdd-new-item"
                onClick={() => { setDropdownOpen(false); setShowCreateModal(true) }}
              >
                <span className="wdd-new-icon">+</span>
                {tw.newWallet}
              </button>
            </div>
          </>
        )}
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
                  {v === 'positions' ? tw.tabPositions : v === 'patrimonio' ? tw.tabPatrimony : tw.tabDividends}
                </button>
              ))}
            </div>
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
              {actionError && <div className="modal-error">{actionError}</div>}
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={() => setDeletingId(null)} disabled={deleteBusy}>
                  {t.confirm.cancel}
                </button>
                <button className="modal-btn-danger" onClick={() => handleDeleteWallet(deletingId)} disabled={deleteBusy}>
                  {deleteBusy ? '…' : t.confirm.delete}
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
  const { t } = useI18n()
  const tw = t.walletView
  const up = wallet.profitOrLoss >= 0
  const assetTypes = buildAssetTypes(wallet)
  const [evolution, setEvolution] = useState<{ month: string; invested: number; marketValue: number }[]>([])
  const [evolutionError, setEvolutionError] = useState(false)
  const [receivedTotal, setReceivedTotal] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setEvolutionError(false)
    api.get<EvolutionPoint[]>(`/api/wallets/${wallet.id}/evolution`)
      .then(res => {
        if (!active) return
        setEvolution(res.data.map(p => ({
          month: fmtMonth(p.month),
          invested: p.invested,
          marketValue: p.marketValue,
        })))
      })
      .catch(() => { if (active) setEvolutionError(true) })
    api.get<Dividend[]>(`/api/wallets/${wallet.id}/dividends`)
      .then(res => {
        if (!active) return
        setReceivedTotal(res.data.filter(d => d.received).reduce((s, d) => s + d.totalAmount, 0))
      })
      .catch(() => { if (active) setReceivedTotal(null) })
    return () => { active = false }
  }, [wallet.id])

  const totalReturnPct = receivedTotal != null && wallet.totalInvested > 0
    ? (wallet.profitOrLoss + wallet.realizedProfitOrLoss + receivedTotal) / wallet.totalInvested * 100
    : null

  return (
    <div className="pat-wrap">
      {/* Summary cards */}
      <div className="pat-cards">
        <div className="pat-card">
          <HelpTip text={tw.helpInvested} />
          <span className="pat-card-label">{tw.totalInvested}</span>
          <span className="pat-card-value">{fmtBRL(wallet.totalInvested)}</span>
        </div>
        <div className="pat-card">
          <span className="pat-card-label">{tw.currentValue}</span>
          <span className="pat-card-value">{fmtBRL(wallet.currentValue)}</span>
        </div>
        <div className="pat-card">
          <span className="pat-card-label">{tw.yield}</span>
          <span className={`pat-card-value ${up ? 'pat-up' : 'pat-down'}`}>
            {up ? '+' : ''}{fmtBRL(wallet.profitOrLoss)}
          </span>
        </div>
        {wallet.realizedProfitOrLoss !== 0 && (
          <div className="pat-card">
            <HelpTip text={tw.helpRealized} />
            <span className="pat-card-label">{tw.realized}</span>
            <span className={`pat-card-value ${wallet.realizedProfitOrLoss >= 0 ? 'pat-up' : 'pat-down'}`}>
              {wallet.realizedProfitOrLoss >= 0 ? '+' : ''}{fmtBRL(wallet.realizedProfitOrLoss)}
            </span>
          </div>
        )}
        <div className="pat-card">
          <span className="pat-card-label">{tw.return}</span>
          <span className={`pat-card-badge ${up ? 'pat-card-badge--up' : 'pat-card-badge--down'}`}>
            {up ? '▲' : '▼'} {up ? '+' : ''}{wallet.profitOrLossPercent.toFixed(2)}%
          </span>
        </div>
        {totalReturnPct != null && (
          <div className="pat-card">
            <HelpTip text={tw.helpReturnWithDiv} />
            <span className="pat-card-label">{tw.returnWithDividends}</span>
            <span className={`pat-card-badge ${totalReturnPct >= 0 ? 'pat-card-badge--up' : 'pat-card-badge--down'}`}>
              {totalReturnPct >= 0 ? '▲' : '▼'} {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Evolution line chart: cost basis vs market value */}
      {evolution.length > 0 && (
        <div className="pat-chart-section">
          <h3 className="pat-section-title">
            {tw.evolutionTitle}
            <HelpTip inline text={tw.helpEvolution} />
          </h3>
          <div className="pat-chart-legend">
            <span className="pat-chart-legend-item"><span className="pat-legend-dot" style={{ background: '#94a3b8' }} /> {tw.contributed}</span>
            <span className="pat-chart-legend-item"><span className="pat-legend-dot" style={{ background: '#378add' }} /> {tw.patrimonyLine}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolution} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmtAxisBRL(v)}
                width={58}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={(v, name) => [fmtBRL(Number(v)), name === 'invested' ? tw.contributed : tw.patrimonyLine]}
              />
              <Line
                type="monotone"
                dataKey="invested"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="marketValue"
                stroke="#378add"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#378add' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {evolutionError && (
        <div className="pat-chart-section">
          <div className="prov-empty">{tw.evolutionError}</div>
        </div>
      )}

      {/* Asset type breakdown */}
      {assetTypes.length > 0 && (
        <div className="pat-chart-section">
          <h3 className="pat-section-title">{tw.byTypeTitle}</h3>
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
                <Tooltip formatter={(v) => fmtBRL(Number(v))} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pat-legend">
              {assetTypes.map((tp, i) => (
                <div key={tp.name} className="pat-legend-row">
                  <span className="pat-legend-dot" style={{ background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                  <span className="pat-legend-name">{tp.name}</span>
                  <span className="pat-legend-value">{fmtBRL(tp.value)}</span>
                  <span className="pat-legend-pct">{tp.pct.toFixed(1)}%</span>
                  <div className="pat-legend-bar-wrap">
                    <div className="pat-legend-bar" style={{ width: `${tp.pct}%`, background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
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
// Wallets already auto-synced this session (module-level so StrictMode remounts share it)
const autoSyncedWallets = new Set<string>()

function ProventosView({ walletId, wallet }: { walletId: string; wallet: WalletSummary }) {
  const { t } = useI18n()
  const tw = t.walletView
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingDividendId, setDeletingDividendId] = useState<string | null>(null)
  const [form, setForm] = useState({ ticker: '', totalAmount: '', paymentDate: '', type: 'DIVIDENDO', received: true })
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // Opening the tab syncs market dividends first (DB-only, cheap) so new/edited
  // entries reflect their dividends without requiring a manual sync click.
  useEffect(() => {
    let active = true
    ;(async () => {
      // autoSyncedWallets: StrictMode mounts the effect twice — two concurrent
      // syncs would race the dedup check and import everything in duplicate.
      if (!autoSyncedWallets.has(walletId)) {
        autoSyncedWallets.add(walletId)
        setSyncing(true)
        try { await api.post(`/api/wallets/${walletId}/dividends/sync`) } catch { /* sync is best-effort here */ }
        if (!active) return
        setSyncing(false)
      }
      await load()
    })()
    return () => { active = false }
  }, [walletId])

  async function load() {
    setLoadError(false)
    try {
      const res = await api.get<Dividend[]>(`/api/wallets/${walletId}/dividends`)
      setDividends(res.data)
    } catch {
      setLoadError(true)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setActionError(null)
    try {
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
    } catch {
      setActionError(tw.actionError)
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(id: string) {
    setBusy(true)
    setActionError(null)
    try {
      await api.patch(`/api/wallets/${walletId}/dividends/${id}/toggle`)
      await load()
    } catch {
      setActionError(tw.actionError)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    setActionError(null)
    try {
      await api.delete(`/api/wallets/${walletId}/dividends/${id}`)
      setDeletingDividendId(null)
      await load()
    } catch {
      setActionError(tw.actionError)
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setActionError(null)
    try {
      await api.post(`/api/wallets/${walletId}/dividends/sync`)
      await load()
    } catch {
      setActionError(tw.actionError)
    } finally {
      setSyncing(false)
    }
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
  const yieldOnCost = wallet.totalInvested > 0 ? total12 / wallet.totalInvested * 100 : null

  const evolution = buildDividendEvolution(received)
  const byTicker = buildDividendByTicker(received)

  // Table: date-range filter + pagination (newest first)
  const filtered = dividends
    .filter(d => (!filterFrom || d.paymentDate >= filterFrom) && (!filterTo || d.paymentDate <= filterTo))
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function changeFilter(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }
  const legendTop = byTicker.slice(0, 7)
  const legendRest = byTicker.slice(7)
  const legendRestPct = legendRest.reduce((s, x) => s + x.pct, 0)

  return (
    <div className="prov-wrap">
      {loadError && <div className="prov-error">{tw.loadError}</div>}
      {actionError && <div className="prov-error">{actionError}</div>}

      {/* Summary */}
      <div className="prov-summary">
        <div className="prov-summary-left">
          <div className="prov-summary-label">
            {tw.monthlyAvg}
            <HelpTip inline text={tw.helpMonthlyAvg} />
          </div>
          <div className="prov-summary-main">{fmtBRL(monthlyAvg)}</div>
          <div className="prov-summary-sub">{tw.total12}: <strong>{fmtBRL(total12)}</strong></div>
          <div className="prov-summary-sub">{tw.totalReceived}: <strong>{fmtBRL(totalReceived)}</strong></div>
          {yieldOnCost != null && (
            <div className="prov-summary-sub">
              {tw.yieldOnCost}: <strong>{yieldOnCost.toFixed(2)}%</strong>
              <HelpTip inline text={tw.helpYieldOnCost} />
            </div>
          )}
          <div className="prov-summary-sub prov-pending">
            {tw.pending}: <strong>{fmtBRL(totalPending)}</strong>
            <HelpTip inline text={tw.helpPending} />
          </div>
          {byTicker.length > 0 && (
            <div className="prov-donut-wrap">
              <div className="prov-donut-title">{tw.distribution}</div>
              <div className="prov-donut-row">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={byTicker} dataKey="value" nameKey="name" innerRadius={38} outerRadius={66} paddingAngle={2}>
                      {byTicker.map((_, i) => <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtBRL(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="prov-donut-legend">
                  {legendTop.map((tk, i) => (
                    <div key={tk.name} className="prov-donut-row-item">
                      <span className="pat-legend-dot" style={{ background: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                      <span>{tk.name}</span>
                      <span className="prov-pct">{tk.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                  {legendRest.length > 0 && (
                    <div className="prov-donut-row-item">
                      <span className="pat-legend-dot" style={{ background: 'var(--border)' }} />
                      <span>{tw.others} ({legendRest.length})</span>
                      <span className="prov-pct">{legendRestPct.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="prov-chart-wrap">
          <div className="prov-chart-header">
            <span className="pat-section-title">{tw.divEvolution}</span>
            <div className="prov-actions">
              <button className="prov-sync-btn" onClick={handleSync} disabled={syncing}>
                {syncing ? tw.syncing : tw.sync}
              </button>
              <button className="prov-add-btn" onClick={() => setShowAdd(v => !v)}>{tw.launch}</button>
            </div>
          </div>
          {evolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={evolution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => fmtAxisBRL(v)} width={54} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(v) => [fmtBRL(Number(v)), tw.received]}
                />
                <Bar dataKey="amount" fill="#378add" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="prov-empty">{tw.noDividends}</div>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form className="prov-form" onSubmit={handleAdd}>
          <h4 className="prov-form-title">{tw.launchTitle}</h4>
          <div className="prov-form-grid">
            <div className="prov-field">
              <label>{tw.asset}</label>
              <input list="prov-tickers" className="prov-input" placeholder="BTHF11"
                value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required />
              <datalist id="prov-tickers">
                {wallet.positions.map(p => <option key={p.ticker} value={p.ticker} />)}
              </datalist>
            </div>
            <div className="prov-field">
              <label>{tw.amount}</label>
              <input className="prov-input" type="number" step="0.01" placeholder="0,00"
                value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} required />
            </div>
            <div className="prov-field">
              <label>{tw.payDate}</label>
              <input className="prov-input" type="date"
                value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} required />
            </div>
            <div className="prov-field">
              <label>{tw.type}</label>
              <select className="prov-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {DIVIDEND_TYPES.map(dt => <option key={dt} value={dt}>{DIVIDEND_TYPE_LABELS[dt] ?? dt}</option>)}
              </select>
            </div>
          </div>
          <label className="prov-check">
            <input type="checkbox" checked={form.received} onChange={e => setForm(f => ({ ...f, received: e.target.checked }))} />
            {tw.alreadyReceived}
          </label>
          <div className="prov-form-footer">
            <button type="button" className="prov-btn-cancel" onClick={() => setShowAdd(false)} disabled={busy}>{tw.cancel}</button>
            <button type="submit" className="prov-btn-save" disabled={busy}>{busy ? '…' : tw.save}</button>
          </div>
        </form>
      )}

      {/* List */}
      {dividends.length > 0 && (
        <div className="prov-table-wrap">
          <div className="prov-filter-bar">
            <label className="prov-filter-field">
              <span>{tw.filterFrom}</span>
              <input type="date" className="prov-input prov-filter-input" value={filterFrom}
                onChange={e => changeFilter(setFilterFrom, e.target.value)} />
            </label>
            <label className="prov-filter-field">
              <span>{tw.filterTo}</span>
              <input type="date" className="prov-input prov-filter-input" value={filterTo}
                onChange={e => changeFilter(setFilterTo, e.target.value)} />
            </label>
            {(filterFrom || filterTo) && (
              <button className="prov-filter-clear" onClick={() => { setFilterFrom(''); setFilterTo(''); setPage(1) }}>
                {tw.filterClear}
              </button>
            )}
            <span className="prov-filter-count">{tw.filterCount(filtered.length)}</span>
          </div>
          <table className="prov-table">
            <thead>
              <tr>
                <th>{tw.asset}</th>
                <th>{tw.type}</th>
                <th>{tw.date}</th>
                <th className="prov-right">{tw.value}</th>
                <th className="prov-center">{tw.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(d => (
                <tr key={d.id}>
                  <td>
                    <Link className="prov-ticker prov-ticker-link" to={`/ticker/${d.ticker}`}>{d.ticker}</Link>
                  </td>
                  <td><span className="prov-type-badge">{DIVIDEND_TYPE_LABELS[d.type] ?? d.type}</span></td>
                  <td className="prov-date">{new Date(d.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="prov-right prov-amount">{fmtBRL(d.totalAmount)}</td>
                  <td className="prov-center">
                    <button className={`prov-status-btn ${d.received ? 'prov-status-btn--received' : 'prov-status-btn--pending'}`}
                      onClick={() => handleToggle(d.id)} disabled={busy}>
                      {d.received ? tw.received : tw.toReceive}
                    </button>
                  </td>
                  <td>
                    <button className="prov-del-btn" onClick={() => setDeletingDividendId(d.id)} disabled={busy}>✕</button>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={6} className="prov-empty-row">{tw.filterEmpty}</td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="prov-pagination">
              <button className="prov-page-btn" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                ‹ {tw.pagePrev}
              </button>
              <span className="prov-page-info">{tw.pageOf(currentPage, totalPages)}</span>
              <button className="prov-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                {tw.pageNext} ›
              </button>
            </div>
          )}
        </div>
      )}

      {deletingDividendId && (
        <div className="modal-backdrop" onClick={() => setDeletingDividendId(null)}>
          <div className="modal modal--confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{tw.deleteDividendTitle}</div>
            <p className="confirm-text">{tw.deleteDividendText}</p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setDeletingDividendId(null)} disabled={busy}>
                {tw.cancel}
              </button>
              <button className="modal-btn-danger" onClick={() => handleDelete(deletingDividendId)} disabled={busy}>
                {busy ? '…' : tw.remove}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
