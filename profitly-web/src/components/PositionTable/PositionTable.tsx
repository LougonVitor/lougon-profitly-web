import type { WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { AssetTypeCard } from '../AssetTypeCard/AssetTypeCard'
import { useI18n } from '../../i18n/I18nContext'
import './PositionTable.css'

interface PositionTableProps {
  walletId: string
  positions: WalletPositionSummary[]
  onWalletUpdate: (updated: WalletSummary) => void
}

const ASSET_TYPE_LABELS_STATIC: Record<string, string> = {
  stock: 'Ações', unit: 'Units', fii: 'FIIs', etf: 'ETFs', bdr: 'BDRs',
  'fi-infra': 'FI-Infra', 'fi-agro': 'FI-Agro', fip: 'FIPs', fidc: 'FIDCs',
  treasury: 'Tesouro Direto', crypto: 'Criptoativos', outros: 'Outros',
}

const TYPE_ORDER: Record<string, number> = {
  stock: 0, unit: 1, fii: 2, etf: 3, bdr: 4,
  'fi-infra': 5, 'fi-agro': 6, fip: 7, fidc: 8,
  treasury: 9, crypto: 10,
}

function sortOrder(assetType: string): number {
  return TYPE_ORDER[assetType.toLowerCase()] ?? 50
}

export function PositionTable({ walletId, positions, onWalletUpdate }: PositionTableProps) {
  const { t } = useI18n()

  function labelFor(key: string): string {
    return (t.assetType as Record<string, string>)[key.toLowerCase()]
      ?? ASSET_TYPE_LABELS_STATIC[key.toLowerCase()]
      ?? key.toUpperCase()
  }

  const groups = new Map<string, WalletPositionSummary[]>()
  for (const pos of positions) {
    const key = pos.assetType?.toLowerCase() ?? 'outros'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(pos)
  }

  const sortedGroups = [...groups.entries()].sort(([a], [b]) => sortOrder(a) - sortOrder(b))
  const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0)

  return (
    <div className="position-table-section">
      <div className="position-table-section-header">
        <span className="position-table-section-title">{t.wallet.positions}</span>
        <span className="position-table-section-count">{t.wallet.assets(positions.length)}</span>
      </div>

      {positions.length === 0 ? (
        <div className="position-table-empty">Nenhuma posição nesta carteira.</div>
      ) : (
        <div className="position-groups">
          {sortedGroups.map(([key, group]) => (
            <AssetTypeCard
              key={key}
              walletId={walletId}
              assetType={key}
              label={labelFor(key)}
              positions={group}
              portfolioCurrentValue={totalCurrentValue}
              onWalletUpdate={onWalletUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
