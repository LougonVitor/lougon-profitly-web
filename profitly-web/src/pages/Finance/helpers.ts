import type { Expense, ExpenseType, MonthSummary } from './types'
import { TYPE_LABELS, TYPE_COLORS } from './constants'

export function fmtBRL(v: number | null | undefined) {
  if (v == null) return 'R$ —'
  return `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m)-1]}/${y}`
}

export function buildPieData(expenses: Expense[]) {
  const map = new Map<ExpenseType, number>()
  for (const e of expenses) {
    const v = e.estimatedValue ?? 0
    if (v > 0) map.set(e.type, (map.get(e.type) ?? 0) + v)
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
  return Array.from(map.entries())
    .map(([type, value]) => ({
      type,
      name: TYPE_LABELS[type],
      value,
      color: TYPE_COLORS[type],
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

export function spentForType(expenses: Expense[], type: ExpenseType) {
  return expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.realValue, 0)
}

export function buildMoM(months: MonthSummary[]) {
  if (months.length < 2) return null
  const curr = months[months.length - 1]
  const prev = months[months.length - 2]
  const totalDelta = curr.total - prev.total
  const totalPct = prev.total > 0 ? (totalDelta / prev.total) * 100 : null

  const types = new Set<ExpenseType>()
  curr.byType.forEach(t => types.add(t.type))
  prev.byType.forEach(t => types.add(t.type))
  const currMap = new Map(curr.byType.map(t => [t.type, t.totalReal]))
  const prevMap = new Map(prev.byType.map(t => [t.type, t.totalReal]))
  const movers = Array.from(types)
    .map(type => ({ type, delta: (currMap.get(type) ?? 0) - (prevMap.get(type) ?? 0) }))
    .filter(m => Math.abs(m.delta) > 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const estimated = curr.byType.reduce((s, t) => s + t.totalEstimated, 0)
  const accuracyPct = estimated > 0 ? (curr.total / estimated) * 100 : null
  return { curr, prev, totalDelta, totalPct, movers, estimated, accuracyPct }
}

export function buildGroupedData(expenses: Expense[]) {
  const map = new Map<ExpenseType, {estimated: number; real: number}>()
  for (const e of expenses) {
    const cur = map.get(e.type) ?? {estimated: 0, real: 0}
    cur.estimated += e.estimatedValue ?? 0
    cur.real += e.realValue
    map.set(e.type, cur)
  }
  return Array.from(map.entries()).map(([type, vals]) => ({
    type: TYPE_LABELS[type],
    estimated: vals.estimated,
    real: vals.real,
  }))
}
