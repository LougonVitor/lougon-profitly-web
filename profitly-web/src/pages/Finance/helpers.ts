import type { Expense, ExpenseType, MonthSummary, BudgetLimit, BudgetRow, BudgetState } from './types'
import { TYPE_LABELS, TYPE_COLORS, BUDGET_WARN_RATIO } from './constants'

export function fmtBRL(v: number | null | undefined) {
  if (v == null) return 'R$ —'
  return `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m)-1]}/${y}`
}

export function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

/** Percentual de `value` sobre `total`. Sem total não há percentual — devolve null. */
export function pctOf(value: number, total: number | null | undefined): number | null {
  if (!total || total <= 0) return null
  return (value / total) * 100
}

export function fmtPct(v: number | null | undefined, digits = 0) {
  if (v == null) return '—'
  return `${v.toFixed(digits).replace('.', ',')}%`
}

/**
 * Junta o orçamento (antigo "limite de gastos") com o que já foi gasto em cada
 * categoria. É a base da seção "Orçamento por categoria": o usuário lê orçamento,
 * gasto, disponível e status sem precisar fazer conta.
 *
 * Entram as categorias com orçamento definido e também as que têm gasto sem
 * orçamento — esconder um gasto só porque não foi planejado seria pior.
 */
export function buildBudgetRows(expenses: Expense[], limits: BudgetLimit[]): BudgetRow[] {
  const budgetByType = new Map<ExpenseType, number>(limits.map(l => [l.type, l.monthlyLimit]))
  const types = new Set<ExpenseType>([...budgetByType.keys()])
  for (const e of expenses) {
    if (e.realValue > 0 || (e.estimatedValue ?? 0) > 0) types.add(e.type)
  }

  return Array.from(types)
    .map(type => {
      const budget = budgetByType.get(type) ?? 0
      const spent = spentForType(expenses, type)
      const pct = budget > 0 ? (spent / budget) * 100 : null
      // Cravar 100% é cumprir o orçamento, não um alerta: "Atenção" é só a faixa
      // entre 80% e 100% — quem ainda pode estourar, mas não estourou.
      let state: BudgetState = 'ok'
      if (pct != null) {
        if (pct > 100) state = 'over'
        else if (pct >= BUDGET_WARN_RATIO * 100 && pct < 100) state = 'warn'
      }
      return {
        type,
        name: TYPE_LABELS[type],
        color: TYPE_COLORS[type],
        budget,
        spent,
        available: budget - spent,
        pct,
        state,
      }
    })
    .sort((a, b) => (b.budget - a.budget) || (b.spent - a.spent))
}

export type AlertLevel = 'danger'|'warn'|'info'|'success'
export interface BudgetAlert {
  type: ExpenseType
  name: string
  color: string
  level: AlertLevel
  message: string
  pct: number | null
}

const ALERT_ORDER: Record<AlertLevel, number> = { danger: 0, warn: 1, info: 2, success: 3 }

/**
 * Converte o estado de cada categoria em um aviso em linguagem natural. Só
 * categorias com orçamento geram alerta — sem orçamento não existe "perto do
 * limite". Ordena pelo que é mais urgente.
 */
export function buildAlerts(rows: BudgetRow[]): BudgetAlert[] {
  return rows
    .filter(r => r.budget > 0 && r.pct != null)
    .map(r => {
      const pct = r.pct as number
      let level: AlertLevel
      let message: string
      if (r.state === 'over') {
        level = 'danger'
        message = `Você ultrapassou o orçamento em ${fmtBRL(r.spent - r.budget)}.`
      } else if (r.state === 'warn') {
        level = 'warn'
        message = `Você já utilizou ${fmtPct(pct)} do orçamento desta categoria.`
      } else if (pct >= 100) {
        level = 'success'
        message = r.type === 'INVESTMENT'
          ? 'Meta de investimento alcançada! 🎉'
          : 'Orçamento cumprido sem estourar.'
      } else {
        level = 'info'
        message = `Você ainda pode gastar ${fmtBRL(r.available)} nesta categoria.`
      }
      return { type: r.type, name: r.name, color: r.color, level, message, pct }
    })
    .sort((a, b) => (ALERT_ORDER[a.level] - ALERT_ORDER[b.level]) || ((b.pct ?? 0) - (a.pct ?? 0)))
}

export function spentForType(expenses: Expense[], type: ExpenseType) {
  return expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.realValue, 0)
}

/** Quanto já saiu por forma de pagamento — alimenta o donut de distribuição. */
export function buildPaymentBreakdown(expenses: Expense[]) {
  const map = new Map<string, number>()
  for (const e of expenses) {
    if (e.realValue <= 0 || e.paymentMethod == null) continue
    map.set(e.paymentMethod, (map.get(e.paymentMethod) ?? 0) + e.realValue)
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
  const rows = Array.from(map.entries())
    .map(([method, value]) => ({ method, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value)
  return { rows, total }
}

/** Dias que faltam até o próximo fechamento de período (o `resetDay` do usuário). */
export function daysLeftInPeriod(resetDay: number, today = new Date()): number {
  const day = Math.min(resetDay, daysInMonth(today.getFullYear(), today.getMonth()))
  let next = new Date(today.getFullYear(), today.getMonth(), day)
  if (next <= today) {
    const m = today.getMonth() + 1
    next = new Date(today.getFullYear(), m, Math.min(resetDay, daysInMonth(today.getFullYear(), m)))
  }
  return Math.max(0, Math.ceil((next.getTime() - today.getTime()) / 86_400_000))
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
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
