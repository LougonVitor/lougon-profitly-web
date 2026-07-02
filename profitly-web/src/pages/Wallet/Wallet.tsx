import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
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
  const [walletView, setWalletView] = useState<'positions' | 'patrimonio'>('positions')
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
              <button
                className={`wallet-view-tab ${walletView === 'positions' ? 'wallet-view-tab--active' : ''}`}
                onClick={() => setWalletView('positions')}
              >
                Posições
              </button>
              <button
                className={`wallet-view-tab ${walletView === 'patrimonio' ? 'wallet-view-tab--active' : ''}`}
                onClick={() => setWalletView('patrimonio')}
              >
                Patrimônio
              </button>
            </div>
            <button className="wallet-delete-btn" onClick={() => setDeletingId(activeWallet.id)}>
              {t.wallet.deleteWallet}
            </button>
          </div>

          {walletView === 'positions' ? (
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
          ) : (
            <PatrimonioView wallet={activeWallet} />
          )}
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
