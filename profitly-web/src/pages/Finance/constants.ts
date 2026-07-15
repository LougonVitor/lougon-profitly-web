import type { ExpenseType, ExpenseStatus, PaymentMethod, BudgetState } from './types'

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
export const TYPE_ICONS: Record<ExpenseType, string> = {
  INVESTMENT:'📈', HOME:'🏠', SIGNATURE:'🔔',
  SPORT:'🏅', LOCOMOTION:'🚌', SUPERMARKET:'🛒',
  LEISURE:'🎮', CREDIT:'💳', MEDICINE:'💊',
  SEPARATE:'📦', EDUCATION:'📚', STYLE:'👕',
}
/** Frase curta que explica o papel da categoria no orçamento. */
export const TYPE_HINTS: Record<ExpenseType, string> = {
  INVESTMENT:'Prioridade alta', HOME:'Essencial', SIGNATURE:'Recorrente',
  SPORT:'Saúde e bem-estar', LOCOMOTION:'Transporte diário', SUPERMARKET:'Essencial',
  LEISURE:'Qualidade de vida', CREDIT:'Atenção aos juros', MEDICINE:'Saúde',
  SEPARATE:'Gastos avulsos', EDUCATION:'Investimento em você', STYLE:'Estilo de vida',
}
export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PAID:'Pago', PARTIAL:'Parcial', PENDING:'Pendente', OVERRUN:'Excedido',
}
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  DEBIT_CARD:'Cartão de Débito', CREDIT_CARD:'Cartão de Crédito',
  BANK_ACCOUNT:'Conta Bancária', PIX:'Pix', CASH:'Dinheiro', OTHER:'Outro',
}
export const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  DEBIT_CARD:'💳', CREDIT_CARD:'💳', BANK_ACCOUNT:'🏦', PIX:'⚡', CASH:'💵', OTHER:'•',
}
export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  DEBIT_CARD:'#378add', CREDIT_CARD:'#8b5cf6', BANK_ACCOUNT:'#ec4899',
  PIX:'#06b6d4', CASH:'#22c55e', OTHER:'#64748b',
}
/** Rótulo do status do orçamento da categoria — a leitura que o usuário faz de bate-pronto. */
export const BUDGET_STATE_LABELS: Record<BudgetState, string> = {
  ok:'No orçamento', warn:'Atenção', over:'Acima do orçamento',
}
export const ALL_TYPES = Object.keys(TYPE_LABELS) as ExpenseType[]
export const ALL_PAYMENT_METHODS = Object.keys(PAYMENT_LABELS) as PaymentMethod[]
export const INVEST_PCTS = Array.from({length: 101}, (_, i) => i)

/** A partir de quanto do orçamento consumido a categoria entra em "Atenção". */
export const BUDGET_WARN_RATIO = 0.8
