import type { WalletPositionSummary } from '../../types/WalletSummary'
import { PositionRow } from '../PositionRow/PositionRow'
import './PositionTable.css'

interface PositionTableProps {
  positions: WalletPositionSummary[]
}

export function PositionTable({ positions }: PositionTableProps) {
  return (
    <div className="position-table-wrap">
      <div className="position-table-header">
        <span className="position-table-title">Positions</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 120 }}>Ticker</th>
            <th className="right" style={{ width: 70 }}>Qty</th>
            <th className="right" style={{ width: 110 }}>Avg price</th>
            <th className="right" style={{ width: 110 }}>Current price</th>
            <th className="right" style={{ width: 120 }}>Invested</th>
            <th className="right" style={{ width: 120 }}>Current value</th>
            <th className="right" style={{ width: 120 }}>P&amp;L</th>
            <th className="right" style={{ width: 100 }}>P&amp;L %</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(position => (
            <PositionRow key={position.id} position={position} />
          ))}
        </tbody>
      </table>
      {positions.length === 0 && (
        <div className="position-table-empty">No positions in this wallet.</div>
      )}
    </div>
  )
}
