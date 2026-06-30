import type { WalletPositionSummary, WalletSummary } from '../../types/WalletSummary'
import { PositionRow } from '../PositionRow/PositionRow'
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

function labelFor(assetType: string | null): string {
  if (!assetType) return 'Outros'
  return ASSET_TYPE_LABELS[assetType.toLowerCase()] ?? assetType.toUpperCase()
}

const TYPE_ORDER: Record<string, number> = { stock: 0, fii: 1 }

function sortOrder(assetType: string | null): number {
  if (!assetType) return 99
  return TYPE_ORDER[assetType.toLowerCase()] ?? 50
}

export function PositionTable({ walletId, positions, onWalletUpdate }: PositionTableProps) {
  const groups: Map<string, WalletPositionSummary[]> = new Map()

  for (const pos of positions) {
    const key = pos.assetType?.toLowerCase() ?? 'outros'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(pos)
  }

  const sortedGroups = [...groups.entries()].sort(
    ([a], [b]) => sortOrder(a) - sortOrder(b)
  )

  const thead = (
    <thead>
      <tr>
        <th style={{ width: 160 }}>Ticker</th>
        <th className="right" style={{ width: 60 }}>Qty</th>
        <th className="right" style={{ width: 110 }}>Avg price</th>
        <th className="right" style={{ width: 120 }}>Current price</th>
        <th className="right" style={{ width: 120 }}>Invested</th>
        <th className="right" style={{ width: 120 }}>Current value</th>
        <th className="right" style={{ width: 120 }}>P&amp;L</th>
        <th className="right" style={{ width: 100 }}>P&amp;L %</th>
        <th style={{ width: 30 }}></th>
      </tr>
    </thead>
  )

  return (
    <div className="position-table-wrap">
      <div className="position-table-header">
        <span className="position-table-title">Positions</span>
        <span className="position-table-count">{positions.length} asset{positions.length !== 1 ? 's' : ''}</span>
      </div>
      <table>
        {thead}
        <tbody>
          {sortedGroups.map(([key, group], groupIndex) => (
            <>
              <tr
                key={`group-${key}`}
                className={`position-group-header ${groupIndex === 0 ? 'position-group-header--first' : ''}`}
              >
                <td colSpan={9}>{labelFor(key)}</td>
              </tr>
              {group.map((position, i) => (
                <PositionRow
                  key={position.id}
                  walletId={walletId}
                  position={position}
                  index={i}
                  onWalletUpdate={onWalletUpdate}
                />
              ))}
            </>
          ))}
        </tbody>
      </table>
      {positions.length === 0 && (
        <div className="position-table-empty">No positions in this wallet.</div>
      )}
    </div>
  )
}
