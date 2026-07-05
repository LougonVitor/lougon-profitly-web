import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { StockAnalysisFull, StatementRow, StatementType } from '../types/StockAnalysis'

export function useStockAnalysis(symbol: string | undefined) {
  const [data, setData] = useState<StockAnalysisFull | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    let active = true
    setLoading(true)
    api.get<StockAnalysisFull>(`/api/stocks/${symbol}/analysis`)
      .then(res => { if (active) setData(res.data) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [symbol])

  return { data, loading }
}

export interface IndicatorHistoryData {
  statistics: StatementRow[]
  financialData: StatementRow[]
}

/** Lazy: only fetches when `enabled` becomes true (first time a chart is opened). */
export function useIndicatorHistory(symbol: string | undefined, enabled: boolean) {
  const [data, setData] = useState<IndicatorHistoryData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol || !enabled || data != null) return
    let active = true
    setLoading(true)
    api.get<IndicatorHistoryData>(`/api/stocks/${symbol}/indicator-history`)
      .then(res => { if (active) setData(res.data) })
      .catch(() => { if (active) setData({ statistics: [], financialData: [] }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, enabled])

  return { data, loading }
}

export function useStockStatements(symbol: string | undefined, type: StatementType) {
  const [rows, setRows] = useState<StatementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    let active = true
    setLoading(true)
    api.get<StatementRow[]>(`/api/stocks/${symbol}/statements/${type}`)
      .then(res => { if (active) setRows(res.data) })
      .catch(() => { if (active) setRows([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [symbol, type])

  return { rows, loading }
}
