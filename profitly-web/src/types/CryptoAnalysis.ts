/** Response of /api/crypto/analysis/{coin} — quote + indicators computed from price history. */
export interface CryptoAnalysis {
  coin: string
  coinName: string | null
  imageUrl: string | null
  currency: string | null
  price: number | null
  priceUsd: number | null
  usdToBrlRate: number | null
  changeValue: number | null
  changePercent: number | null
  dayHigh: number | null
  dayLow: number | null
  volume24h: number | null
  marketTime: string | null
  syncedAt: string | null
  volumeRank: number | null
  totalCoins: number | null
  high52w: number | null
  low52w: number | null
  /** Where the current price sits inside the 52-week range, 0–100. */
  positionInRange52w: number | null
  athPrice: number | null
  athDate: string | null
  /** Negative percentage below the all-time high (0 when at ATH). */
  distanceFromAthPercent: number | null
  /** Percent returns keyed by period: 7d, 1m, 3m, 6m, ytd, 1y, 2y, max. */
  returns: Record<string, number> | null
  volatility30d: number | null
  volatility1y: number | null
  maxDrawdown1y: number | null
  sma50: number | null
  sma200: number | null
  priceVsSma50Percent: number | null
  priceVsSma200Percent: number | null
  historyDays: number | null
  historyStart: string | null
}
