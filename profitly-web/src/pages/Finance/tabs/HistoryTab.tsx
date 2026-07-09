import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { HistoryData } from '../types'
import { TYPE_LABELS, TYPE_COLORS, ALL_TYPES } from '../constants'
import { fmtBRL, fmtMonth, buildMoM } from '../helpers'

interface HistoryTabProps {
  history: HistoryData | null
  histFrom: string
  histTo: string
  onHistFromChange: (v: string) => void
  onHistToChange: (v: string) => void
  onExport: (url: string, filename: string) => void
}

export function HistoryTab({ history, histFrom, histTo, onHistFromChange, onHistToChange, onExport }: HistoryTabProps) {
  return (
    <div className="fin-history fin-animate-in">
      <div className="fin-history-filters">
        <div className="fin-table-header" style={{marginBottom:'1rem'}}>
          <h3 className="fin-section-title">Histórico de gastos</h3>
          <button className="fin-link-btn" onClick={()=>onExport('/api/finance/export/history', 'historico.csv')}>
            ⤓ exportar CSV
          </button>
        </div>
        <div className="fin-filter-row">
          <div className="fin-field">
            <label>De</label>
            <select className="fin-input" value={histFrom} onChange={e=>onHistFromChange(e.target.value)}>
              <option value="">Início</option>
              {history?.availableMonths.map(m=><option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
          </div>
          <div className="fin-field">
            <label>Até</label>
            <select className="fin-input" value={histTo} onChange={e=>onHistToChange(e.target.value)}>
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
                <Tooltip formatter={(v) => fmtBRL(Number(v))} />
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
                <Tooltip formatter={(v) => fmtBRL(Number(v))} />
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
  )
}
