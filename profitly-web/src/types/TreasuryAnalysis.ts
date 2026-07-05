/** One same-indexer sibling bond inside the treasury analysis payload. */
export interface TreasurySimilarBond {
  symbol: string
  bondType: string | null
  couponType: string | null
  maturityDate: string | null
  buyRate: number | null
  sellRate: number | null
  buyPrice: number | null
}

/** Response of /api/treasury/analysis/{symbol} — snapshot + indicators computed from rate/price history. */
export interface TreasuryAnalysis {
  symbol: string
  bondType: string | null
  indexer: string | null
  couponType: string | null
  maturityDate: string | null
  durationDays: number | null
  baseDate: string | null
  buyRate: number | null
  sellRate: number | null
  buyPrice: number | null
  sellPrice: number | null
  basePrice: number | null
  rateType: string | null
  rateUnit: string | null
  rateDescription: string | null
  syncedAt: string | null
  daysToMaturity: number | null
  yearsToMaturity: number | null
  /** buyRate − sellRate, in percentage points. */
  rateSpread: number | null
  /** buyRate change in percentage points keyed by period: 1m, 3m, 6m, 1y, max. */
  rateChanges: Record<string, number> | null
  rate52wHigh: number | null
  rate52wLow: number | null
  /** Where the current buyRate sits inside the 52-week range, 0–100. */
  ratePositionInRange52w: number | null
  rateHistoryHigh: number | null
  rateHistoryHighDate: string | null
  rateHistoryLow: number | null
  rateHistoryLowDate: string | null
  /** Percent returns of the mark-to-market price keyed by period: 1m, 3m, 6m, 1y, max. */
  priceReturns: Record<string, number> | null
  priceVolatility1y: number | null
  maxDrawdown1y: number | null
  rateRankInIndexer: number | null
  totalInIndexer: number | null
  historyDays: number | null
  historyStart: string | null
  similarBonds: TreasurySimilarBond[] | null
}
