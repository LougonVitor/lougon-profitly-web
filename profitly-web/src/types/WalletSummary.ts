export type EntryType = 'BUY' | 'SELL'

export interface PositionEntry {
  id: string
  date: string
  quantity: number
  paidPrice: number
  type: EntryType
  total: number
}

export interface WalletPositionSummary {
  id: string
  ticker: string
  name: string | null
  logoUrl: string | null
  assetType: string | null
  quantity: number
  averagePrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  profitOrLoss: number
  profitOrLossPercent: number
  realizedProfitOrLoss: number
  entries: PositionEntry[]
}

export interface WalletSummary {
  id: string
  name: string
  positions: WalletPositionSummary[]
  totalInvested: number
  currentValue: number
  profitOrLoss: number
  profitOrLossPercent: number
  realizedProfitOrLoss: number
  createdAt: string
}
