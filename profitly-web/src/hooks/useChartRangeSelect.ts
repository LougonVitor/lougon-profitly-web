import { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveTooltipLabel } from 'recharts'

export interface RangeSelection {
  startX: string | number
  endX: string | number
  startY: number
  endY: number
  changeAbs: number
  changePct: number | null
}

/**
 * Reports the chart's currently hovered x-axis label (Recharts v3 no longer
 * puts this on the onMouseMove event — it lives in the chart's internal state
 * and must be read via this hook from a component rendered *inside* the chart).
 * Render `<ChartRangeSelectTracker onLabel={reportLabel} />` as a child of the
 * `<AreaChart>`/`<LineChart>` alongside `useChartRangeSelect`.
 */
export function ChartRangeSelectTracker({ onLabel }: { onLabel: (label: string | number | undefined) => void }) {
  const label = useActiveTooltipLabel()
  useEffect(() => { onLabel(label) }, [label, onLabel])
  return null
}

/**
 * Click-and-drag range selection over a Recharts chart (Google Finance style):
 * drag across the plot to highlight a period and get its start/end value delta.
 * Wire `onMouseDown`/`onMouseUp` to the chart element, render a
 * `<ChartRangeSelectTracker onLabel={reportLabel} />` inside it to feed the
 * currently hovered label, and render
 * `<ReferenceArea x1={refAreaLeft} x2={refAreaRight} .../>` while dragging.
 */
export function useChartRangeSelect<T extends Record<string, unknown>>(
  data: T[],
  xKey: keyof T,
  yKey: keyof T,
) {
  const draggingRef = useRef(false)
  const startLabelRef = useRef<string | number | null>(null)
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | ''>('')
  const [refAreaRight, setRefAreaRight] = useState<string | number | ''>('')
  const [selection, setSelection] = useState<RangeSelection | null>(null)

  const finalize = useCallback((endLabel: string | number | null) => {
    const left = startLabelRef.current
    if (left == null || endLabel == null || left === endLabel) {
      setRefAreaLeft('')
      setRefAreaRight('')
      return
    }
    let leftIdx = data.findIndex(d => d[xKey] === left)
    let rightIdx = data.findIndex(d => d[xKey] === endLabel)
    if (leftIdx === -1 || rightIdx === -1) { setRefAreaLeft(''); setRefAreaRight(''); return }
    if (leftIdx > rightIdx) [leftIdx, rightIdx] = [rightIdx, leftIdx]
    const startPoint = data[leftIdx]
    const endPoint = data[rightIdx]
    const startY = Number(startPoint[yKey])
    const endY = Number(endPoint[yKey])
    const changeAbs = endY - startY
    const changePct = startY !== 0 ? (changeAbs / Math.abs(startY)) * 100 : null
    setSelection({
      startX: startPoint[xKey] as string | number,
      endX: endPoint[xKey] as string | number,
      startY, endY, changeAbs, changePct,
    })
    setRefAreaLeft(startPoint[xKey] as string | number)
    setRefAreaRight(endPoint[xKey] as string | number)
  }, [data, xKey, yKey])

  const refAreaRightRef = useRef<string | number | null>(null)

  const onMouseDown = useCallback(() => {
    draggingRef.current = true
    startLabelRef.current = null
    refAreaRightRef.current = null
    setSelection(null)
    setRefAreaLeft('')
    setRefAreaRight('')
  }, [])

  const onMouseUp = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    finalize(refAreaRightRef.current)
  }, [finalize])

  const reportLabel = useCallback((label: string | number | undefined) => {
    if (label == null || !draggingRef.current) return
    if (startLabelRef.current == null) {
      startLabelRef.current = label
      setRefAreaLeft(label)
    }
    refAreaRightRef.current = label
    setRefAreaRight(label)
  }, [])

  const clearSelection = useCallback(() => {
    setSelection(null)
    setRefAreaLeft('')
    setRefAreaRight('')
  }, [])

  return { refAreaLeft, refAreaRight, selection, onMouseDown, onMouseUp, reportLabel, clearSelection }
}
