export interface WalletPositionSummary {
  id: string
  ticker: string
  logoUrl: string | null
  quantity: number
  averagePrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  profitOrLoss: number
  profitOrLossPercent: number
}

export interface WalletSummary {
  id: string
  name: string
  positions: WalletPositionSummary[]
  totalInvested: number
  currentValue: number
  profitOrLoss: number
  profitOrLossPercent: number
  createdAt: string
}
