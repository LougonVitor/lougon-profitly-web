import type { BudgetAlert } from '../helpers'
import { fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

const LEVEL_ICONS: Record<BudgetAlert['level'], string> = {
  danger: '🔺', warn: '⚠️', info: 'ℹ️', success: '✅',
}

export function AlertsPanel({ alerts }: { alerts: BudgetAlert[] }) {
  return (
    <div className="fin-alerts fin-animate-in">
      <h3 className="fin-section-title fin-alerts-title">
        <span className="fin-alerts-bell">🔔</span> Alertas do mês
        <HelpTip inline text="Avisos gerados a partir do orçamento de cada categoria: em âmbar ao passar de 80% do planejado e em vermelho ao ultrapassá-lo." />
      </h3>

      {alerts.length === 0 ? (
        <p className="fin-alerts-empty">
          Defina um orçamento nas categorias para receber avisos quando um gasto se aproximar do planejado.
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
