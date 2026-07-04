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
