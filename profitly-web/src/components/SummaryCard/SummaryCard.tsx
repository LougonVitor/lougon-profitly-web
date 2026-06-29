import './SummaryCard.css'

interface SummaryCardProps {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'positive' | 'negative'
}

export function SummaryCard({ label, value, sub, variant = 'default' }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className={`summary-value summary-value--${variant}`}>{value}</div>
      {sub && <div className={`summary-sub summary-sub--${variant}`}>{sub}</div>}
    </div>
  )
}