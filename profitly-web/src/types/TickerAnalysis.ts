export interface DividendItem {
  assetIssued: string
  paymentDate: string | null
  rate: number | null
  relatedTo: string | null
  label: string | null
  lastDatePrior: string | null
}

export interface TickerAnalysis {
  symbol: string
  name: string | null
  longName: string | null
  assetType: string | null
  subType: string | null
  sector: string | null
  logoUrl: string | null
  lastPrice: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null

  trailingPE: number | null
  priceToBook: number | null
  dividendYield: number | null
  beta: number | null
  earningsPerShare: number | null
  forwardPE: number | null
  pegRatio: number | null
  enterpriseToRevenue: number | null
  enterpriseToEbitda: number | null
  enterpriseValue: number | null
  bookValue: number | null
  weekChange52: number | null
  profitMargins: number | null
  sharesOutstanding: number | null
  lastDividendValue: number | null
  lastDividendDate: string | null

  dividends: DividendItem[]
  syncedAt: string
}

export interface PriceBar {
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  adjustedClose: number | null
  volume: number | null
}

export interface PriceHistory {
  symbol: string
  range: string
  prices: PriceBar[]
}
