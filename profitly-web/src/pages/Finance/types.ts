// ── Finance domain types (shared across the tab components) ────────────────────
export type ExpenseType = 'INVESTMENT'|'HOME'|'SIGNATURE'|'SPORT'|'LOCOMOTION'|
  'SUPERMARKET'|'LEISURE'|'CREDIT'|'MEDICINE'|'SEPARATE'|'EDUCATION'|'STYLE'
export type ExpenseStatus = 'PAID'|'PARTIAL'|'PENDING'|'OVERRUN'
export type PaymentMethod = 'DEBIT_CARD'|'CREDIT_CARD'|'BANK_ACCOUNT'|'PIX'|'CASH'|'OTHER'

export interface Expense {
  id: number
  title: string
  description: string | null
  estimatedValue: number | null
  realValue: number
  status: ExpenseStatus
  type: ExpenseType
  paymentMethod: PaymentMethod | null
  createdAt: string
  recurring: boolean
}

export interface AdditionalIncome {
  id: number
  description: string
  amount: number
  createdAt: string
}

export interface BudgetLimit {
  type: ExpenseType
  monthlyLimit: number
}

export interface CurrentPeriod {
  expenses: Expense[]
  netSalary: number | null
  investmentTarget: number | null
  totalReal: number
  totalEstimated: number
  balance: number
  resetDay: number
  additionalIncomes: AdditionalIncome[]
  totalIncome: number
  budgetLimits: BudgetLimit[]
  investedThisMonth: number
  investmentAuto: boolean
  totalSpent: number
  investedReal: number
  savedThisMonth: number
  savingsTarget: number | null
}

export interface RecurringExpense {
  id: number
  title: string
  estimatedValue: number | null
  type: ExpenseType
  dueDay: number | null
  variable: boolean
}

export interface RecurringIncome {
  id: number
  description: string
  amount: number
  dueDay: number | null
}

export interface Settings {
  resetDay: number
  netSalary: number | null
  investmentTarget: number | null
  investmentAuto: boolean
  savingsTarget: number | null
}
export interface TypeTotal { type: ExpenseType; totalReal: number; totalEstimated: number }
export interface MonthSummary { yearMonth: string; byType: TypeTotal[]; total: number }
export interface HistoryData { months: MonthSummary[]; availableMonths: string[] }

export type EditField = 'title'|'estimated'|'real'|'type'
export interface EditCell { id: number; field: EditField }

/** Uma categoria na visão "Orçamento por categoria": o limite virou o orçamento do mês. */
export type BudgetState = 'ok'|'warn'|'over'
export interface BudgetRow {
  type: ExpenseType
  name: string
  color: string
  budget: number
  spent: number
  available: number
  /** Percentual do orçamento já consumido. Sem orçamento definido, fica null. */
  pct: number | null
  state: BudgetState
}
