// ── Finance domain types (shared across the tab components) ────────────────────
export type ExpenseType = 'INVESTMENT'|'HOME'|'SIGNATURE'|'SPORT'|'LOCOMOTION'|
  'SUPERMARKET'|'LEISURE'|'CREDIT'|'MEDICINE'|'SEPARATE'|'EDUCATION'|'STYLE'
export type ExpenseStatus = 'PAID'|'PARTIAL'|'PENDING'|'OVERRUN'

export interface Expense {
  id: number
  title: string
  estimatedValue: number | null
  realValue: number
  status: ExpenseStatus
  type: ExpenseType
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

export interface Settings { resetDay: number; netSalary: number | null; investmentTarget: number | null; investmentAuto: boolean }
export interface TypeTotal { type: ExpenseType; totalReal: number; totalEstimated: number }
export interface MonthSummary { yearMonth: string; byType: TypeTotal[]; total: number }
export interface HistoryData { months: MonthSummary[]; availableMonths: string[] }

export type EditField = 'title'|'estimated'|'real'|'type'
export interface EditCell { id: number; field: EditField }
