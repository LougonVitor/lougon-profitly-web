import type { ExpenseType, ExpenseStatus } from './types'

export const TYPE_LABELS: Record<ExpenseType, string> = {
  INVESTMENT:'Investimento', HOME:'Casa', SIGNATURE:'Assinaturas',
  SPORT:'Esporte', LOCOMOTION:'Locomoção', SUPERMARKET:'Supermercado',
  LEISURE:'Lazer', CREDIT:'Crédito', MEDICINE:'Medicina',
  SEPARATE:'Avulso', EDUCATION:'Educação', STYLE:'Estilo',
}
export const TYPE_COLORS: Record<ExpenseType, string> = {
  INVESTMENT:'#378add', HOME:'#22c55e', SIGNATURE:'#f59e0b',
  SPORT:'#8b5cf6', LOCOMOTION:'#06b6d4', SUPERMARKET:'#f97316',
  LEISURE:'#ec4899', CREDIT:'#64748b', MEDICINE:'#ef4444',
  SEPARATE:'#a78bfa', EDUCATION:'#10b981', STYLE:'#d97706',
}
export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PAID:'Pago', PARTIAL:'Parcial', PENDING:'Pendente', OVERRUN:'Excedido',
}
export const ALL_TYPES = Object.keys(TYPE_LABELS) as ExpenseType[]
export const INVEST_PCTS = Array.from({length: 101}, (_, i) => i)
