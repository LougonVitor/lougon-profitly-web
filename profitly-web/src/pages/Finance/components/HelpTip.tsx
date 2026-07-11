// Small "?" affordance that reveals an explanation on hover/focus — mirrors the
// ta-metric-help pattern used on the ticker analysis screens. Place inside a
// position: relative container; it anchors to the top-right corner.
export function HelpTip({ text }: { text: string }) {
  return (
    <span className="fin-help" tabIndex={0} aria-label={text}>
      ?
      <span className="fin-help-tip">{text}</span>
    </span>
  )
}
