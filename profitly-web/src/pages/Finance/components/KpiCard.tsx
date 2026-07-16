import type { ReactNode } from 'react'
import { fmtBRL, fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

export type KpiTone = 'pos'|'neg'|'neutral'|'accent'

interface KpiCardProps {
  label: string
  value: number | null
  /** Linha de apoio abaixo do valor (ex.: "Total recebido"). */
  caption?: string
  /**
   * Percentual da renda. Fica na legenda, junto do caption — no rótulo ele
   * competia por espaço e quebrava "POUPANÇA DO MÊS" no meio.
   */
  pct?: number | null
  tone?: KpiTone
  help?: string
  /** Rodapé livre do card (ex.: o editor de meta da poupança). */
  children?: ReactNode
}

export function KpiCard({ label, value, caption, pct, tone = 'neutral', help, children }: KpiCardProps) {
  const captionParts = [pct != null ? `${fmtPct(pct)} da renda` : null, caption].filter(Boolean)

  return (
    <div className={`fin-kpi fin-kpi--${tone} fin-animate-in`}>
      {help && <HelpTip text={help} />}
      <div className="fin-kpi-label">{label}</div>
      <div className="fin-kpi-value">{fmtBRL(value)}</div>
      {captionParts.length > 0 && (
        <div className="fin-kpi-caption">{captionParts.join(' · ')}</div>
      )}
      {children}
    </div>
  )
}
