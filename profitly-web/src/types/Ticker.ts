export interface Ticker {
  symbol: string
  name: string
  longName: string | null
  assetType: string | null
  subType: string | null
  sector: string | null
  isActive: boolean
  logoUrl: string | null
  lastPrice: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null
}
