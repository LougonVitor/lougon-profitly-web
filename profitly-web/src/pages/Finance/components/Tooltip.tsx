import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const TIP_WIDTH = 200
const VIEWPORT_MARGIN = 10

// Hover/focus balloon that wraps an arbitrary element (a button, an icon...) —
// same portal-positioning trick as HelpTip, but anchored to the wrapped
// element's own bounding rect instead of a fixed "?" affordance.
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function show() {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const left = Math.min(
      Math.max(r.left + r.width / 2 - TIP_WIDTH / 2, VIEWPORT_MARGIN),
      window.innerWidth - TIP_WIDTH - VIEWPORT_MARGIN,
    )
    setPos({ top: r.bottom + 8, left })
  }

  function hide() {
    setPos(null)
  }

  return (
    <span
      ref={anchorRef}
      className="fin-tooltip-anchor"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos && createPortal(
        <span className="fin-help-tip" style={{ top: pos.top, left: pos.left, width: TIP_WIDTH }}>
          {text}
        </span>,
        document.body,
      )}
    </span>
  )
}
