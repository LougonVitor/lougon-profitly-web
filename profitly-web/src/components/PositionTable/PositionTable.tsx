import type { WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { AssetTypeCard } from '../AssetTypeCard/AssetTypeCard'
import './PositionTable.css'

interface PositionTableProps {
  walletId: string
  positions: WalletPositionSummary[]
  onWalletUpdate: (updated: WalletSummary) => void
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Ações',
  fii: 'FIIs',
}

function labelFor(assetType: string): string {
  return ASSET_TYPE_LABELS[assetType.toLowerCase()] ?? assetType.toUpperCase()
}

const TYPE_ORDER: Record<string, number> = { stock: 0, fii: 1 }

function sortOrder(assetType: string): number {
  return TYPE_ORDER[assetType.toLowerCase()] ?? 50
}

export function PositionTable({ walletId, positions, onWalletUpdate }: PositionTableProps) {
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
        <span className="position-table-section-title">Posições</span>
        <span className="position-table-section-count">{positions.length} ativo{positions.length !== 1 ? 's' : ''}</span>
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
