import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { WalletPositionSummary } from '../../types/WalletSummary'
import './AllocationChart.css'

const COLORS = ['#378add', '#1d9e75', '#f59e0b', '#8b5cf6', '#e24b4a', '#06b6d4', '#f97316']

interface AllocationChartProps {
  positions: WalletPositionSummary[]
  totalCurrentValue: number
}

export function AllocationChart({ positions, totalCurrentValue }: AllocationChartProps) {
  const data = positions.map(p => ({
    name: p.ticker,
    value: Number(p.currentValue),
    pct: totalCurrentValue > 0
      ? ((Number(p.currentValue) / totalCurrentValue) * 100).toFixed(1)
      : '0.0',
  }))

  return (
    <div className="allocation-chart">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={62}
            paddingAngle={3}
            dataKey="value"
            animationBegin={200}
            animationDuration={800}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              name,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="allocation-legend">
        {data.map((entry, i) => (
          <div key={entry.name} className="allocation-legend-item">
            <span className="allocation-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="allocation-ticker">{entry.name}</span>
            <span className="allocation-pct">{entry.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
