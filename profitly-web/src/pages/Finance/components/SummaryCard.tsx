import { fmtBRL } from '../helpers'

export function SummaryCard({ label, value, icon, tone = 'neutral' }: {
  label: string; value: number|null; icon: string; tone?: 'pos'|'neg'|'neutral'
}) {
  return (
    <div className={`fin-card fin-card--${tone} fin-animate-in`}>
      <span className="fin-card-icon">{icon}</span>
      <div>
        <div className="fin-card-label">{label}</div>
        <div className="fin-card-value">{fmtBRL(value)}</div>
      </div>
    </div>
  )
}
