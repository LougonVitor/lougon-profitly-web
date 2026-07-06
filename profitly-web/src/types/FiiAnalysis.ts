/** One dividend event inside the FII analysis payload. */
export interface FiiAnalysisDividendEvent {
  approvedOn: string | null
  lastDatePrior: string | null
  paymentDate: string | null
  rate: number | null
  label: string | null
}

/** One same-segment sibling FII inside the FII analysis payload. */
export interface FiiSimilarFii {
  symbol: string
  name: string | null
  segmentType: string | null
  price: number | null
  priceToNav: number | null
  dividendYield12m: number | null
  dividendYield1m: number | null
  equity: number | null
  totalInvestors: number | null
}

/** One property inside the latest quarter's portfolio (tijolo segment). */
export interface FiiPropertyItem {
  name: string | null
  address: string | null
  propertyClass: string | null
  area: number | null
  vacancyRate: number | null
  revenueShare: number | null
}

/** One asset-class allocation inside the latest quarter's portfolio. */
export interface FiiAllocationItem {
  assetClass: string | null
  count: number | null
  value: number | null
}

/** Raw brapi document (properties/portfolio) — shape varies per FII segment. */
export type FiiRawDocument = Record<string, unknown>

/** Response of /api/fii/analysis/{symbol} — snapshot + indicators computed from indicator history, price and dividend history. */
export interface FiiAnalysis {
  symbol: string
  name: string | null
  cnpj: string | null
  mandate: string | null
  segmentoAtuacao: string | null
  tipoGestao: string | null
  segmentType: string | null
  adminName: string | null
  adminCnpj: string | null
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
  dividendYield12m: number | null
  dividendYield1m: number | null
  dividendsSum12m: number | null
  dividendCount12m: number | null
  /** Most recent payout per quota (R$). */
  lastDividend: number | null
  /** Dividends over the last 3 months / current price (%). */
  dividendYield3m: number | null
  /** Dividends over the last 6 months / current price (%). */
  dividendYield6m: number | null
  /** Average of the monthly DY-12m across history (%). */
  avgDividendYield: number | null
  /** Average daily financial volume (R$) over ~21 trading days. */
  avgDailyLiquidity: number | null
  /** Management fee, annualized (% a.a.). */
  adminFeeRate: number | null
  /** Quota price divided by the last monthly payout per quota. */
  magicNumber: number | null
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
  recentDividends: FiiAnalysisDividendEvent[] | null
  similarFiis: FiiSimilarFii[] | null
  /** Latest area-weighted vacancy rate (%), tijolo segment only. */
  vacancyRate: number | null
  /** Vacancy rate (%) by quarter reference date, oldest first — tijolo segment only. */
  vacancyHistory: Record<string, number> | null
  /** Individual properties of the latest quarter, sorted by revenue share descending — tijolo segment only. */
  properties: FiiPropertyItem[] | null
  /** Portfolio composition by asset class of the latest quarter. */
  portfolioAllocations: FiiAllocationItem[] | null
  /** Latest raw documents keyed by type: properties, portfolio. */
  documents: Record<string, FiiRawDocument> | null
}
