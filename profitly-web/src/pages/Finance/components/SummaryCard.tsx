import { fmtBRL } from '../helpers'
import { HelpTip } from './HelpTip'

export function SummaryCard({ label, value, icon, tone = 'neutral', help }: {
  label: string; value: number|null; icon: string; tone?: 'pos'|'neg'|'neutral'; help?: string
}) {
  return (
    <div className={`fin-card fin-card--${tone} fin-animate-in`}>
      {help && <HelpTip text={help} />}
      <span className="fin-card-icon">{icon}</span>
      <div>
        <div className="fin-card-label">{label}</div>
        <div className="fin-card-value">{fmtBRL(value)}</div>
      </div>
    </div>
  )
}
