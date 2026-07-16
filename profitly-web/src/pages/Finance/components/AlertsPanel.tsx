import type { BudgetAlert } from '../helpers'
import { fmtBRL, fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

const LEVEL_ICONS: Record<BudgetAlert['level'], string> = {
  danger: '🔺', warn: '⚠️', info: 'ℹ️', success: '✅',
}

interface AlertsPanelProps {
  alerts: BudgetAlert[]
  // Meta de poupança — mora aqui porque no card de KPI ela esticava só aquele
  // card e deixava os outros quatro com um vão embaixo.
  saved: number
  savingsTarget: number | null
  savingsPct: number | null
  editingSavings: boolean
  onStartEditSavings: () => void
  onCancelEditSavings: () => void
  savingsTargetInput: string
  onSavingsTargetChange: (v: string) => void
  onSaveSavingsTarget: () => void
}

export function AlertsPanel({
  alerts, saved, savingsTarget, savingsPct,
  editingSavings, onStartEditSavings, onCancelEditSavings,
  savingsTargetInput, onSavingsTargetChange, onSaveSavingsTarget,
}: AlertsPanelProps) {
  return (
    <div className="fin-alerts fin-animate-in">
      <h3 className="fin-section-title fin-alerts-title">
        <span className="fin-alerts-bell">🔔</span> Alertas do mês
        <HelpTip inline text="Avisos gerados a partir do orçamento de cada categoria: em âmbar ao passar de 80% do planejado e em vermelho ao ultrapassá-lo." />
      </h3>

      <div className="fin-goal">
        <div className="fin-goal-head">
          <span className="fin-goal-label">
            Meta de poupança
            <HelpTip inline text="Quanto você pretende guardar por mês. O progresso compara a poupança do mês com essa meta." />
          </span>
          {editingSavings ? (
            <div className="fin-goal-edit">
              <span className="fin-goal-prefix">R$</span>
              <input
                className="fin-goal-input"
                autoFocus
                type="number"
                step="0.01"
                min="0"
                value={savingsTargetInput}
                onChange={e => onSavingsTargetChange(e.target.value)}
                onBlur={onSaveSavingsTarget}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveSavingsTarget()
                  if (e.key === 'Escape') onCancelEditSavings()
                }}
              />
            </div>
          ) : (
            <button className="fin-goal-btn" onClick={onStartEditSavings} title="Clique para editar a meta">
              {savingsTarget != null
                ? <>{fmtBRL(saved)} <span className="fin-goal-of">/ {fmtBRL(savingsTarget)}</span></>
                : <span className="fin-goal-unset">definir meta</span>}
              <span className="fin-edit-hint">✎</span>
            </button>
          )}
        </div>
        {savingsPct != null && (
          <>
            <div className="fin-goal-track">
              <div
                className="fin-goal-fill"
                style={{ width: `${Math.min(Math.max(savingsPct, 0), 100)}%` }}
              />
            </div>
            <span className="fin-goal-note">{fmtPct(savingsPct)} da meta</span>
          </>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="fin-alerts-empty">
          Assim que seus lançamentos tiverem gastos esperados, os avisos de orçamento aparecem aqui.
        </p>
      ) : (
        <ul className="fin-alerts-list">
          {alerts.map(a => (
            <li key={a.type} className={`fin-alert fin-alert--${a.level}`}>
              <span className="fin-alert-icon">{LEVEL_ICONS[a.level]}</span>
              <div className="fin-alert-body">
                <span className="fin-alert-name">{a.name}</span>
                <span className="fin-alert-msg">{a.message}</span>
              </div>
              <div className="fin-alert-meter">
                <span className="fin-alert-pct">{fmtPct(a.pct)}</span>
                <span className="fin-alert-bar" style={{ background: a.color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
