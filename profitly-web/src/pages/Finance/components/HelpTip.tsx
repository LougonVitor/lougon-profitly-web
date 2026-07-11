// Small "?" affordance that reveals an explanation on hover/focus — mirrors the
// ta-metric-help pattern used on the ticker analysis screens.
// Default: absolute, anchored to the top-right corner of a position: relative
// container. inline: sits next to the label text (for table headers / titles).
export function HelpTip({ text, inline }: { text: string; inline?: boolean }) {
  return (
    <span className={`fin-help ${inline ? 'fin-help--inline' : ''}`} tabIndex={0} aria-label={text}>
      ?
      <span className="fin-help-tip">{text}</span>
    </span>
  )
}
