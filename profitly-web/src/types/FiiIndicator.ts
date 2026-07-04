export interface FiiIndicator {
  symbol: string
  asOfDate: string | null
  price: number | null
  navPerShare: number | null
  priceToNav: number | null
  dividendYield12m: number | null
  dividendYield1m: number | null
  monthlyReturn: number | null
  totalInvestors: number | null
  sharesOutstanding: number | null
  equity: number | null
  totalAssets: number | null
  segmentType: string | null
  adminName: string | null
  adminCnpj: string | null
  syncedAt: string
}

export interface FiiIndicatorHistory {
  id: number
  symbol: string
  referenceDate: string
  price: number | null
  navPerShare: number | null
  priceToNav: number | null
  dividendYield12m: number | null
  dividendYield1m: number | null
  monthlyReturn: number | null
  totalInvestors: number | null
  sharesOutstanding: number | null
  equity: number | null
  totalAssets: number | null
  segmentType: string | null
}
