import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import type { BudgetRow, ExpenseType } from '../types'
import { TYPE_ICONS, TYPE_HINTS, TYPE_COLORS, BUDGET_STATE_LABELS } from '../constants'
import { fmtBRL, fmtPct } from '../helpers'
import { HelpTip } from './HelpTip'

export type BudgetView = 'list'|'chart'|'donut'

interface BudgetSectionProps {
  rows: BudgetRow[]
  view: BudgetView
  onViewChange: (v: BudgetView) => void
  onDeleteBudget: (type: ExpenseType) => void
  // Edição do orçamento direto na célula
  editingType: ExpenseType | null
  editValue: string
  onStartEdit: (row: BudgetRow) => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  /** Renda total do período — base do donut de "% do salário por categoria". */
  totalIncome: number
  /** Mede a altura renderizada para o painel de Alertas, ao lado, acompanhar. */
  sectionRef?: (el: HTMLDivElement | null) => void
}

export function BudgetSection({
  rows, view, onViewChange, onDeleteBudget,
  editingType, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
  totalIncome, sectionRef,
}: BudgetSectionProps) {
  return (
    <div ref={sectionRef} className="fin-budget-section fin-animate-in">
      <div className="fin-table-header">
        <h3 className="fin-section-title">
          Orçamento por categoria
          <HelpTip inline text="Cada categoria entra aqui sozinha assim que você cria um lançamento nela, e o orçamento vem da soma dos gastos esperados desses lançamentos. Clique no valor para ajustar à mão." />
        </h3>
        <div className="fin-header-actions">
          <div className="fin-view-toggle" role="group" aria-label="Forma de visualização">
            <button
              type="button"
              className={`fin-view-btn ${view === 'list' ? 'fin-view-btn--active' : ''}`}
              onClick={() => onViewChange('list')}
              aria-pressed={view === 'list'}
            >☰ Lista</button>
            <button
              type="button"
              className={`fin-view-btn ${view === 'chart' ? 'fin-view-btn--active' : ''}`}
              onClick={() => onViewChange('chart')}
              aria-pressed={view === 'chart'}
            >📊 Gráfico</button>
            <button
              type="button"
              className={`fin-view-btn ${view === 'donut' ? 'fin-view-btn--active' : ''}`}
              onClick={() => onViewChange('donut')}
              aria-pressed={view === 'donut'}
            >🍩 Distribuição</button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="fin-recurring-desc">
          Crie um lançamento e preencha o gasto esperado dele: a categoria aparece aqui automaticamente, com o orçamento já preenchido.
        </p>
      ) : view === 'list' ? (
        <BudgetTable
          rows={rows}
          onDeleteBudget={onDeleteBudget}
          editingType={editingType}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onEditChange={onEditChange}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
        />
      ) : view === 'chart' ? (
        <BudgetChart rows={rows} />
      ) : (
        <BudgetDonut rows={rows} totalIncome={totalIncome} />
      )}
    </div>
  )
}

interface BudgetTableProps {
  rows: BudgetRow[]
  onDeleteBudget: (type: ExpenseType) => void
  editingType: ExpenseType | null
  editValue: string
  onStartEdit: (row: BudgetRow) => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
}

function BudgetTable({
  rows, onDeleteBudget, editingType, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
}: BudgetTableProps) {
  return (
    <table className="fin-table fin-budget-table">
      <thead>
        <tr>
          <th className="fin-bcol-cat"><span className="fin-th-inner">Categoria</span></th>
          <th className="fin-bcol-num">
            <span className="fin-th-inner">Orçamento
              <HelpTip inline text="Vem da soma dos gastos esperados dos lançamentos da categoria. Clique no valor para definir um orçamento próprio." />
            </span>
          </th>
          <th className="fin-bcol-num">
            <span className="fin-th-inner">Gasto atual
              <HelpTip inline text="Soma do que já saiu nos lançamentos desta categoria." />
            </span>
          </th>
          <th className="fin-bcol-num">
            <span className="fin-th-inner">Disponível
              <HelpTip inline text="Orçamento menos o gasto atual. Negativo significa que você passou do planejado." />
            </span>
          </th>
          <th className="fin-bcol-prog"><span className="fin-th-inner">Progresso</span></th>
          <th className="fin-bcol-status">
            <span className="fin-th-inner">Status
              <HelpTip inline text="No orçamento = até 80% do planejado, ou exatamente 100%. Atenção = de 80% a 99%, quando ainda dá para estourar. Acima do orçamento = passou do planejado." />
            </span>
          </th>
          <th className="fin-bcol-act"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.type} className={`fin-row fin-budget-row fin-budget-row--${r.state} fin-animate-row`}>
            <td className="fin-bcol-cat" data-label="Categoria">
              <div className="fin-budget-cat">
                <span className="fin-budget-icon" style={{ background: r.color + '22', color: r.color }}>
                  {TYPE_ICONS[r.type]}
                </span>
                <span className="fin-budget-names">
                  <span className="fin-budget-name">{r.name}</span>
                  <span className="fin-budget-hint">{TYPE_HINTS[r.type]}</span>
                </span>
              </div>
            </td>

            <td className="fin-bcol-num" data-label="Orçamento">
              {editingType === r.type ? (
                <input
                  className="fin-inline-input fin-inline-input--number"
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editValue}
                  onChange={e => onEditChange(e.target.value)}
                  onBlur={onCommitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit() }}
                />
              ) : (
                <span
                  className={`fin-editable-cell fin-budget-budget ${r.auto ? 'fin-budget-budget--auto' : ''}`}
                  onClick={() => onStartEdit(r)}
                  title={r.auto
                    ? 'Somado dos gastos esperados desta categoria. Clique para definir um valor próprio.'
                    : 'Orçamento definido por você. Clique para editar.'}
                >
                  {r.budget > 0 ? fmtBRL(r.budget) : <span className="fin-budget-unset">definir</span>}
                </span>
              )}
            </td>

            <td className="fin-bcol-num" data-label="Gasto atual">{fmtBRL(r.spent)}</td>

            <td
              className={`fin-bcol-num ${r.available < 0 ? 'fin-budget-negative' : 'fin-budget-available'}`}
              data-label="Disponível"
            >
              {r.budget > 0 ? fmtBRL(r.available) : <span className="fin-budget-unset">—</span>}
            </td>

            <td className="fin-bcol-prog" data-label="Progresso">
              {r.pct == null ? (
                <span className="fin-budget-unset">—</span>
              ) : (
                <div className="fin-budget-progress">
                  <span className="fin-budget-pct">{fmtPct(r.pct)}</span>
                  <div className="fin-budget-track">
                    <div
                      className="fin-budget-fill"
                      style={{ width: `${Math.min(r.pct, 100)}%`, background: r.state === 'over' ? '#ef4444' : r.color }}
                    />
                  </div>
                </div>
              )}
            </td>

            <td className="fin-bcol-status" data-label="Status">
              {r.pct == null ? (
                <span className="fin-budget-unset">—</span>
              ) : (
                <span className={`fin-budget-badge fin-budget-badge--${r.state}`}>
                  {BUDGET_STATE_LABELS[r.state]}
                </span>
              )}
            </td>

            <td className="fin-bcol-act">
              {/* Só faz sentido descartar um valor digitado: o automático voltaria na hora. */}
              {!r.auto && (
                <button
                  className="fin-icon-btn fin-icon-btn--danger"
                  onClick={() => onDeleteBudget(r.type)}
                  title="Voltar ao orçamento automático (soma dos gastos esperados)"
                >↺</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Comparativo orçamento × gasto por categoria, escalado pelo maior valor da tela. */
function BudgetChart({ rows }: { rows: BudgetRow[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.budget, r.spent), 0)
  if (max <= 0) return null

  return (
    <div className="fin-budget-chart">
      <div className="fin-budget-chart-legend">
        <span><i className="fin-swatch fin-swatch--budget" /> Orçamento</span>
        <span><i className="fin-swatch fin-swatch--spent" /> Gasto real</span>
      </div>
      <div className="fin-budget-chart-rows">
        {rows.map(r => (
          <div key={r.type} className="fin-budget-chart-row">
            <div className="fin-budget-chart-label">
              <span className="fin-cat-dot" style={{ background: r.color }} />
              {r.name}
            </div>
            <div className="fin-budget-chart-bars">
              <div className="fin-budget-chart-bar-wrap">
                <div className="fin-budget-chart-bar fin-budget-chart-bar--budget" style={{ width: `${(r.budget / max) * 100}%` }} />
                <span className="fin-budget-chart-val">{r.budget > 0 ? fmtBRL(r.budget) : '—'}</span>
              </div>
              <div className="fin-budget-chart-bar-wrap">
                <div
                  className="fin-budget-chart-bar fin-budget-chart-bar--spent"
                  style={{ width: `${(r.spent / max) * 100}%`, background: r.state === 'over' ? '#ef4444' : TYPE_COLORS[r.type] }}
                />
                <span className="fin-budget-chart-val">{fmtBRL(r.spent)}</span>
              </div>
            </div>
            <div className={`fin-budget-chart-pct fin-budget-chart-pct--${r.state}`}>
              {r.pct == null ? '—' : fmtPct(r.pct)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type DonutMetric = 'estimated'|'real'
const FREE_SLICE_COLOR = '#94a3b8'

/**
 * Quanto cada categoria representa do salário total, mais o quanto ainda está
 * livre — alterna entre gastos esperados e gastos reais sem trocar de aba.
 */
function BudgetDonut({ rows, totalIncome }: { rows: BudgetRow[]; totalIncome: number }) {
  const [metric, setMetric] = useState<DonutMetric>('estimated')

  if (!totalIncome || totalIncome <= 0) {
    return (
      <p className="fin-recurring-desc">
        Lance sua renda do mês em Entradas para ver a distribuição do salário por categoria.
      </p>
    )
  }

  const values = rows
    .map(r => ({ type: r.type, name: r.name, color: r.color, value: metric === 'estimated' ? r.budget : r.spent }))
    .filter(r => r.value > 0)

  const spentTotal = values.reduce((s, r) => s + r.value, 0)
  // Se os gastos já passaram da renda, a "torta" cresce para caber tudo — não
  // há livre nesse caso, mas as fatias continuam proporcionais entre si.
  const pieTotal = Math.max(totalIncome, spentTotal)
  const free = pieTotal - spentTotal

  const data = [
    ...values.map(r => ({ name: r.name, value: r.value, color: r.color })),
    ...(free > 0.005 ? [{ name: 'Livre', value: free, color: FREE_SLICE_COLOR }] : []),
  ]

  return (
    <div className="fin-donut">
      <div className="fin-donut-toggle-row">
        <div className="fin-donut-toggle" role="group" aria-label="Métrica exibida no donut">
          <button
            type="button"
            className={`fin-donut-toggle-btn ${metric === 'estimated' ? 'fin-donut-toggle-btn--active' : ''}`}
            onClick={() => setMetric('estimated')}
            aria-pressed={metric === 'estimated'}
          >Gastos esperados</button>
          <button
            type="button"
            className={`fin-donut-toggle-btn ${metric === 'real' ? 'fin-donut-toggle-btn--active' : ''}`}
            onClick={() => setMetric('real')}
            aria-pressed={metric === 'real'}
          >Gastos reais</button>
        </div>
        <HelpTip inline text="Cada fatia mostra quanto uma categoria consome do seu salário do mês. 'Livre' é o que sobra depois de todas as categorias. Alterne entre o que você planejou gastar (esperados) e o que já saiu de fato (reais)." />
      </div>

      <div className="fin-donut-row">
        <div className="fin-donut-chart-wrap">
          <ResponsiveContainer width={190} height={190}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={2} strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <RechartsTooltip formatter={(v: number) => fmtBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="fin-donut-center">
            <span className="fin-donut-center-value">{fmtPct((free / pieTotal) * 100)}</span>
            <span className="fin-donut-center-label">livre</span>
          </div>
        </div>

        <div className="fin-donut-legend">
          {values.map(r => (
            <div key={r.type} className="fin-donut-legend-item">
              <span className="fin-cat-dot" style={{ background: r.color }} />
              <span className="fin-donut-legend-name">{r.name}</span>
              <span className="fin-donut-legend-pct">{fmtPct((r.value / pieTotal) * 100)}</span>
              <span className="fin-donut-legend-val">{fmtBRL(r.value)}</span>
            </div>
          ))}
          <div className="fin-donut-legend-item fin-donut-legend-item--free">
            <span className="fin-cat-dot" style={{ background: FREE_SLICE_COLOR }} />
            <span className="fin-donut-legend-name">Livre</span>
            <span className="fin-donut-legend-pct">{fmtPct((free / pieTotal) * 100)}</span>
            <span className="fin-donut-legend-val">{fmtBRL(Math.max(free, 0))}</span>
          </div>
        </div>
      </div>

      {spentTotal > totalIncome && (
        <p className="fin-donut-overrun-note">
          ⚠ Os gastos {metric === 'estimated' ? 'esperados' : 'reais'} já ultrapassam sua renda do mês — não sobra nada livre.
        </p>
      )}
    </div>
  )
}
