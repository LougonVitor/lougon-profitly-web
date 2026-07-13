export type EntryType = 'BUY' | 'SELL'

export interface PositionEntry {
  id: string
  date: string
  quantity: number
  paidPrice: number
  type: EntryType
  total: number
}

export type FixedIncomeIndexer = 'CDI' | 'SELIC' | 'IPCA' | 'PREFIXADO'
export type FixedIncomeInstrumentType = 'CDB' | 'LCI' | 'LCA' | 'LC' | 'LF' | 'RDB'

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
  issuer: string | null
  instrumentType: FixedIncomeInstrumentType | null
  indexer: FixedIncomeIndexer | null
  ratePercent: number | null
  dailyLiquidity: boolean | null
  maturityDate: string | null
}

export type WalletSource = 'MANUAL' | 'B3'

export interface WalletSummary {
  id: string
  name: string
  positions: WalletPositionSummary[]
  totalInvested: number
  currentValue: number
  profitOrLoss: number
  profitOrLossPercent: number
  realizedProfitOrLoss: number
  source: WalletSource
  createdAt: string
}

export interface B3ImportResult {
  imported: number
  duplicates: number
  skipped: number
  skippedByType: Record<string, number>
  errors: string[]
}
