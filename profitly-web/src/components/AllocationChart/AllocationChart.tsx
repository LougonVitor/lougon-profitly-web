import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { WalletPositionSummary } from '../../types/WalletSummary'
import { useI18n } from '../../i18n/I18nContext'
import './AllocationChart.css'

const COLORS = ['#378add', '#1d9e75', '#f59e0b', '#8b5cf6', '#e24b4a', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1']

type Mode = 'ticker' | 'class'

interface AllocationChartProps {
  positions: WalletPositionSummary[]
  totalCurrentValue: number
}

function buildTickerData(positions: WalletPositionSummary[], total: number) {
  return positions.map(p => ({
    name: p.ticker,
    value: Number(p.currentValue),
    pct: total > 0 ? ((Number(p.currentValue) / total) * 100).toFixed(1) : '0.0',
  }))
}

function buildClassData(positions: WalletPositionSummary[], total: number) {
  const map = new Map<string, number>()
  for (const p of positions) {
    const key = p.assetType ?? 'outros'
    map.set(key, (map.get(key) ?? 0) + Number(p.currentValue))
  }
  return [...map.entries()].map(([name, value]) => ({
    name,
    value,
    pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
  }))
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AllocationChart({ positions, totalCurrentValue }: AllocationChartProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('class')
  const [drillClass, setDrillClass] = useState<string | null>(null)

  const isClassMode = mode === 'class'

  let data: { name: string; value: number; pct: string }[]
  if (isClassMode && drillClass) {
    const filtered = positions.filter(p => (p.assetType ?? 'outros') === drillClass)
    const subtotal = filtered.reduce((s, p) => s + Number(p.currentValue), 0)
    data = buildTickerData(filtered, subtotal)
  } else if (isClassMode) {
    data = buildClassData(positions, totalCurrentValue)
  } else {
    data = buildTickerData(positions, totalCurrentValue)
  }

  function handlePieClick(entry: { name: string }) {
    if (isClassMode && !drillClass) {
      setDrillClass(entry.name)
    }
  }

  const assetTypeLabel = (key: string) =>
    (t.assetType as Record<string, string>)[key.toLowerCase()] ?? key.toUpperCase()

  return (
    <div className="allocation-chart">
      <div className="allocation-mode-row">
        <button
          className={`allocation-mode-btn ${mode === 'ticker' ? 'allocation-mode-btn--active' : ''}`}
          onClick={() => { setMode('ticker'); setDrillClass(null) }}
        >
          {t.chart.byTicker}
        </button>
        <button
          className={`allocation-mode-btn ${mode === 'class' ? 'allocation-mode-btn--active' : ''}`}
          onClick={() => { setMode('class'); setDrillClass(null) }}
        >
          {t.chart.byClass}
        </button>
        {drillClass && (
          <button className="allocation-back-btn" onClick={() => setDrillClass(null)}>
            ← {assetTypeLabel(drillClass)}
          </button>
        )}
      </div>

      <div className="allocation-body">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
              onClick={(_, __, e) => {
                const entry = data[(e.target as SVGElement)?.closest('[name]')?.getAttribute('name') as unknown as number]
                if (entry) handlePieClick(entry)
              }}
              style={{ cursor: isClassMode && !drillClass ? 'pointer' : 'default' }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [
                fmtBRL(Number(value)),
                isClassMode && !drillClass ? assetTypeLabel(String(name)) : String(name),
              ] as [string, string]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="allocation-legend">
          {data.map((entry, i) => (
            <div
              key={entry.name}
              className={`allocation-legend-item ${isClassMode && !drillClass ? 'allocation-legend-item--clickable' : ''}`}
              onClick={() => isClassMode && !drillClass && handlePieClick(entry)}
            >
              <span className="allocation-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="allocation-ticker">
                {isClassMode && !drillClass ? assetTypeLabel(entry.name) : entry.name}
              </span>
              <span className="allocation-pct">{entry.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
