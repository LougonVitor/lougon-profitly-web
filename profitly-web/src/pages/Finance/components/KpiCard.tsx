import { fmtBRL, fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

export type KpiTone = 'pos'|'neg'|'neutral'|'accent'|'invest'

interface KpiCardProps {
  label: string
  value: number | null
  /** Linha de apoio abaixo do valor (ex.: "Total recebido"). */
  caption?: string
  /** Percentual da renda. Quando informado, aparece junto ao rótulo. */
  pct?: number | null
  tone?: KpiTone
  help?: string
  /** Progresso 0-100 contra uma meta. Quando informado, desenha a barra. */
  progressPct?: number | null
  progressLabel?: string
}

export function KpiCard({
  label, value, caption, pct, tone = 'neutral', help, progressPct, progressLabel,
}: KpiCardProps) {
  return (
    <div className={`fin-kpi fin-kpi--${tone} fin-animate-in`}>
      {help && <HelpTip text={help} />}
      <div className="fin-kpi-label">
        {label}
        {pct != null && <span className="fin-kpi-pct">{fmtPct(pct)} da renda</span>}
      </div>
      <div className="fin-kpi-value">{fmtBRL(value)}</div>
      {caption && <div className="fin-kpi-caption">{caption}</div>}
      {progressPct != null && (
        <div className="fin-kpi-progress">
          <div className="fin-kpi-progress-track">
            <div className="fin-kpi-progress-fill" style={{ width: `${Math.min(Math.max(progressPct, 0), 100)}%` }} />
          </div>
          {progressLabel && <span className="fin-kpi-progress-label">{progressLabel}</span>}
        </div>
      )}
    </div>
  )
}
