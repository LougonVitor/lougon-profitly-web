import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TIP_WIDTH = 230
const VIEWPORT_MARGIN = 10

// Small "?" affordance that reveals an explanation on hover/focus — mirrors the
// ta-metric-help pattern used on the ticker analysis screens.
// Default: absolute, anchored to the top-right corner of a position: relative
// container. inline: sits next to the label text (for table headers / titles).
// The tip itself is rendered through a portal at a fixed position computed from
// the icon's location, so it always escapes any scrolling/clipping ancestor
// (tables, chart cards, etc.) instead of being cut off or growing a scrollbar.
export function HelpTip({ text, inline }: { text: string; inline?: boolean }) {
  const iconRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function show() {
    const el = iconRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const left = Math.min(
      Math.max(r.right - TIP_WIDTH, VIEWPORT_MARGIN),
      window.innerWidth - TIP_WIDTH - VIEWPORT_MARGIN,
    )
    setPos({ top: r.bottom + 8, left })
  }

  function hide() {
    setPos(null)
  }

  return (
    <>
      <span
        ref={iconRef}
        className={`fin-help ${inline ? 'fin-help--inline' : ''}`}
        tabIndex={0}
        aria-label={text}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        ?
      </span>
      {pos && createPortal(
        <span className="fin-help-tip" style={{ top: pos.top, left: pos.left }}>
          {text}
        </span>,
        document.body,
      )}
    </>
  )
}
