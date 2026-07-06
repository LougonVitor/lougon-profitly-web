/** One dividend event inside the fund analysis payload. */
export interface FundDividendEvent {
  declaredDate: string | null
  lastDatePrior: string | null
  paymentDate: string | null
  rate: number | null
  label: string | null
}

/** One same-type sibling fund inside the fund analysis payload. */
export interface FundSimilarFund {
  symbol: string
  name: string | null
  fundType: string | null
  price: number | null
  priceToNav: number | null
  dividendYield12m: number | null
  dividendYieldMonthly: number | null
  equity: number | null
  totalInvestors: number | null
}

/** Raw brapi document (profile/portfolio/reports) — shape varies per fund type. */
export type FundRawDocument = Record<string, unknown>

/** Response of /api/funds/analysis/{symbol} — snapshot + indicators computed from NAV, price and dividend history. */
export interface FundAnalysis {
  symbol: string
  name: string | null
  legalName: string | null
  cnpj: string | null
  fundType: string | null
  b3Classification: string | null
  isin: string | null
  status: string | null
  adminName: string | null
  managerName: string | null
  price: number | null
  navPerShare: number | null
  priceToNav: number | null
  equity: number | null
  totalAssets: number | null
  totalInvestors: number | null
  sharesOutstanding: number | null
  asOfDate: string | null
  syncedAt: string | null
  monthlyReturn: number | null
  patrimonialMonthlyReturn: number | null
  dividendYieldMonthly: number | null
  dividendYield12m: number | null
  dividendYield1m: number | null
  dividendsSum12m: number | null
  dividendCount12m: number | null
  /** Market price returns (%) keyed by period: 1m, 3m, 6m, 1y, max. */
  priceReturns: Record<string, number> | null
  priceVolatility1y: number | null
  priceMaxDrawdown1y: number | null
  price52wHigh: number | null
  price52wLow: number | null
  pricePositionInRange52w: number | null
  /** NAV-per-share returns (%) keyed by period: 1m, 3m, 6m, 1y, max. */
  navReturns: Record<string, number> | null
  equityChanges: Record<string, number> | null
  investorsChanges: Record<string, number> | null
  nav52wHigh: number | null
  nav52wLow: number | null
  navPositionInRange52w: number | null
  navHistoryHigh: number | null
  navHistoryHighDate: string | null
  navHistoryLow: number | null
  navHistoryLowDate: string | null
  navVolatility1y: number | null
  maxDrawdown1y: number | null
  dyRankInType: number | null
  totalInType: number | null
  historyDays: number | null
  historyStart: string | null
  recentDividends: FundDividendEvent[] | null
  similarFunds: FundSimilarFund[] | null
  /** Latest raw documents keyed by type: profile, portfolio, fiagro_report,
   *  fiagro_portfolio, fidc_report, fidc_portfolio, fip_report. */
  documents: Record<string, FundRawDocument> | null
}
