export interface StockQuote {
  symbol: string
  shortName: string | null
  longName: string | null
  currency: string | null
  price: number | null
  dayHigh: number | null
  dayLow: number | null
  change: number | null
  changePercent: number | null
  marketTime: string | null
  marketCap: number | null
  volume: number | null
  previousClose: number | null
  openPrice: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
  logoUrl: string | null
}

export interface StockProfile {
  symbol: string
  name: string | null
  sector: string | null
  industry: string | null
  longBusinessSummary: string | null
  fullTimeEmployees: number | null
  website: string | null
  twitter: string | null
  startDate: string | null
  cnpj: string | null
  address1: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  logoUrl: string | null
}

export interface StockFinancials {
  symbol: string
  totalCash: number | null
  totalCashPerShare: number | null
  ebitda: number | null
  totalDebt: number | null
  quickRatio: number | null
  currentRatio: number | null
  totalRevenue: number | null
  debtToEquity: number | null
  returnOnAssets: number | null
  returnOnEquity: number | null
  grossProfits: number | null
  freeCashflow: number | null
  operatingCashflow: number | null
  earningsGrowth: number | null
  revenueGrowth: number | null
  earningsGrowthAnnual: number | null
  revenueGrowthAnnual: number | null
  grossMargins: number | null
  ebitdaMargins: number | null
  operatingMargins: number | null
  profitMargins: number | null
}

export interface StockDividendEvent {
  symbol: string
  assetIssued: string | null
  paymentDate: string | null
  rate: number | null
  relatedTo: string | null
  approvedOn: string | null
  label: string | null
  lastDatePrior: string | null
  remarks: string | null
}

export interface DividendAnalysis {
  events: StockDividendEvent[]
  dyByYear: Record<string, number>
  avgDy5y: number
}

export interface ComparisonEntry {
  company: number | null
  sectorAvg: number | null
  sampleSize: number
}

export interface SectorComparison {
  sector: string
  industry: string | null
  peerCount: number
  indicators: Record<string, ComparisonEntry>
}

export interface StockAnalysisFull {
  quote: StockQuote | null
  profile: StockProfile | null
  financials: StockFinancials | null
  dividends: DividendAnalysis | null
  sectorComparison: SectorComparison | null
  keyIndicators: Record<string, number | null> | null
}

/** Statement rows keep every field brapi returns; endDate/type are always present. */
export type StatementRow = { endDate: string; type: string } & Record<string, unknown>

export type StatementType = 'income_statement' | 'balance_sheet' | 'cash_flow' | 'value_added'
