import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useStockStatements } from '../../hooks/useStockAnalysis'
import type {
  StockAnalysisFull, StockFinancials, SectorComparison, StatementRow, StatementType,
} from '../../types/StockAnalysis'

// ── formatting helpers ───────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPctFrac(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${fmt(v * 100)}%`
}

function fmtBig(v: number | null | undefined): string {
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1e12) return `${fmt(v / 1e12, 2)}T`
  if (abs >= 1e9)  return `${fmt(v / 1e9, 2)}B`
  if (abs >= 1e6)  return `${fmt(v / 1e6, 1)}M`
  if (abs >= 1e3)  return `${fmt(v / 1e3, 0)}k`
  return fmt(v, 0)
}

function fmtCnpj(v: string | null | undefined): string {
  if (!v || v.length !== 14) return v ?? '—'
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
}

// ── 52-week range bar ────────────────────────────────────────────────────────

export function FiftyTwoWeekRange({ quote }: { quote: StockAnalysisFull['quote'] }) {
  if (!quote || quote.fiftyTwoWeekLow == null || quote.fiftyTwoWeekHigh == null || quote.price == null) return null
  const { fiftyTwoWeekLow: low, fiftyTwoWeekHigh: high, price } = quote
  const pct = high > low ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100)) : 50

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Faixa de 52 Semanas</div>
      <div className="ta-52w">
        <span className="ta-52w-bound">R$ {fmt(low)}</span>
        <div className="ta-52w-track">
          <div className="ta-52w-fill" style={{ width: `${pct}%` }} />
          <div className="ta-52w-marker" style={{ left: `${pct}%` }}>
            <span className="ta-52w-price">R$ {fmt(price)}</span>
          </div>
        </div>
        <span className="ta-52w-bound">R$ {fmt(high)}</span>
      </div>
    </div>
  )
}

// ── profitability / financial highlights ────────────────────────────────────

export function FinancialHighlights({ financials }: { financials: StockFinancials | null }) {
  if (!financials) return null
  const f = financials
  return (
    <div className="ta-info-grid">
      <div className="ta-section-card">
        <div className="ta-section-title">Rentabilidade e Margens</div>
        <div className="ta-info-rows">
          <div className="ta-info-row"><span>ROE (Retorno s/ Patrimônio)</span><strong className="up">{fmtPctFrac(f.returnOnEquity)}</strong></div>
          <div className="ta-info-row"><span>ROA (Retorno s/ Ativos)</span><strong>{fmtPctFrac(f.returnOnAssets)}</strong></div>
          <div className="ta-info-row"><span>Margem Bruta</span><strong>{fmtPctFrac(f.grossMargins)}</strong></div>
          <div className="ta-info-row"><span>Margem EBITDA</span><strong>{fmtPctFrac(f.ebitdaMargins)}</strong></div>
          <div className="ta-info-row"><span>Margem Operacional</span><strong>{fmtPctFrac(f.operatingMargins)}</strong></div>
          <div className="ta-info-row"><span>Margem Líquida</span><strong>{fmtPctFrac(f.profitMargins)}</strong></div>
          <div className="ta-info-row"><span>Cresc. Receita (anual)</span><strong>{fmtPctFrac(f.revenueGrowthAnnual ?? f.revenueGrowth)}</strong></div>
          <div className="ta-info-row"><span>Cresc. Lucro (anual)</span><strong>{fmtPctFrac(f.earningsGrowthAnnual ?? f.earningsGrowth)}</strong></div>
        </div>
      </div>

      <div className="ta-section-card">
        <div className="ta-section-title">Endividamento e Caixa</div>
        <div className="ta-info-rows">
          <div className="ta-info-row"><span>Receita Total</span><strong>R$ {fmtBig(f.totalRevenue)}</strong></div>
          <div className="ta-info-row"><span>EBITDA</span><strong>R$ {fmtBig(f.ebitda)}</strong></div>
          <div className="ta-info-row"><span>Lucro Bruto</span><strong>R$ {fmtBig(f.grossProfits)}</strong></div>
          <div className="ta-info-row"><span>Caixa Total</span><strong>R$ {fmtBig(f.totalCash)}</strong></div>
          <div className="ta-info-row"><span>Dívida Total</span><strong>R$ {fmtBig(f.totalDebt)}</strong></div>
          <div className="ta-info-row"><span>Dívida / Patrimônio</span><strong>{fmt(f.debtToEquity)}</strong></div>
          <div className="ta-info-row"><span>Liquidez Corrente</span><strong>{fmt(f.currentRatio)}</strong></div>
          <div className="ta-info-row"><span>Fluxo de Caixa Livre</span><strong>R$ {fmtBig(f.freeCashflow)}</strong></div>
          <div className="ta-info-row"><span>Fluxo de Caixa Operacional</span><strong>R$ {fmtBig(f.operatingCashflow)}</strong></div>
        </div>
      </div>
    </div>
  )
}

// ── sector comparison ────────────────────────────────────────────────────────

interface IndicatorConfig {
  key: string
  label: string
  format: (v: number | null) => string
  /** true when a LOWER value is better (P/L, P/VP, dívida) */
  lowerIsBetter?: boolean
}

const SECTOR_INDICATORS: IndicatorConfig[] = [
  { key: 'pl',            label: 'P/L',              format: v => fmt(v),        lowerIsBetter: true },
  { key: 'pvp',           label: 'P/VP',             format: v => fmt(v),        lowerIsBetter: true },
  { key: 'dividendYield', label: 'Dividend Yield',   format: v => fmtPctFrac(v) },
  { key: 'evEbitda',      label: 'EV/EBITDA',        format: v => fmt(v),        lowerIsBetter: true },
  { key: 'roe',           label: 'ROE',              format: v => fmtPctFrac(v) },
  { key: 'roa',           label: 'ROA',              format: v => fmtPctFrac(v) },
  { key: 'profitMargin',  label: 'Margem Líquida',   format: v => fmtPctFrac(v) },
  { key: 'grossMargin',   label: 'Margem Bruta',     format: v => fmtPctFrac(v) },
  { key: 'debtToEquity',  label: 'Dívida/Patrimônio', format: v => fmt(v),       lowerIsBetter: true },
  { key: 'revenueGrowth', label: 'Cresc. Receita',   format: v => fmtPctFrac(v) },
]

export function SectorComparisonSection({ comparison }: { comparison: SectorComparison | null }) {
  if (!comparison) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Comparação com o Setor</div>
        <span className="ta-sector-badge">
          {comparison.sector} · {comparison.peerCount} empresas
        </span>
      </div>
      <div className="ta-sector-table-wrap">
        <table className="ta-sector-table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="right">Empresa</th>
              <th className="right">Média do Setor</th>
              <th className="right">Posição</th>
            </tr>
          </thead>
          <tbody>
            {SECTOR_INDICATORS.map(ind => {
              const entry = comparison.indicators[ind.key]
              if (!entry || (entry.company == null && entry.sectorAvg == null)) return null
              const { company, sectorAvg } = entry
              let verdict: 'better' | 'worse' | null = null
              if (company != null && sectorAvg != null && sectorAvg !== 0) {
                const isAbove = company > sectorAvg
                verdict = ind.lowerIsBetter ? (isAbove ? 'worse' : 'better') : (isAbove ? 'better' : 'worse')
              }
              return (
                <tr key={ind.key}>
                  <td>{ind.label}</td>
                  <td className="right ta-sector-company">{ind.format(company)}</td>
                  <td className="right">{ind.format(sectorAvg)}</td>
                  <td className="right">
                    {verdict && (
                      <span className={`ta-sector-verdict ta-sector-verdict--${verdict}`}>
                        {verdict === 'better' ? '▲ Melhor' : '▼ Pior'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="ta-sector-note">
        "Melhor" indica desempenho superior à média do setor no indicador (considera que P/L, P/VP, EV/EBITDA e dívida são melhores quando menores).
      </div>
    </div>
  )
}

// ── company profile ──────────────────────────────────────────────────────────

export function CompanyProfileSection({ profile }: { profile: StockAnalysisFull['profile'] }) {
  const [expanded, setExpanded] = useState(false)
  if (!profile) return null

  const summary = profile.longBusinessSummary
  const truncated = summary && summary.length > 420 && !expanded

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Sobre a Empresa</div>
      <div className="ta-profile-grid">
        <div className="ta-info-rows">
          <div className="ta-info-row"><span>Setor</span><strong>{profile.sector ?? '—'}</strong></div>
          <div className="ta-info-row"><span>Indústria</span><strong>{profile.industry ?? '—'}</strong></div>
          <div className="ta-info-row"><span>Funcionários</span><strong>{profile.fullTimeEmployees != null ? profile.fullTimeEmployees.toLocaleString('pt-BR') : '—'}</strong></div>
          <div className="ta-info-row"><span>CNPJ</span><strong>{fmtCnpj(profile.cnpj)}</strong></div>
          <div className="ta-info-row"><span>Sede</span><strong>{[profile.city, profile.state].filter(Boolean).join(' - ') || '—'}</strong></div>
          {profile.website && (
            <div className="ta-info-row"><span>Site RI</span>
              <strong><a className="ta-profile-link" href={profile.website} target="_blank" rel="noreferrer">
                {profile.website.replace(/^https?:\/\//, '')}
              </a></strong>
            </div>
          )}
        </div>
        {summary && (
          <div className="ta-profile-summary">
            <p>{truncated ? `${summary.slice(0, 420)}…` : summary}</p>
            {summary.length > 420 && (
              <button className="ta-profile-more" onClick={() => setExpanded(e => !e)}>
                {expanded ? 'Mostrar menos' : 'Ler mais'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── financial statements ─────────────────────────────────────────────────────

interface StatementConfig {
  type: StatementType
  label: string
  /** snapshot statements (balance sheet) can't be summed across quarters —
   *  the extra bar shows the latest quarterly position instead of TTM/YTD sums */
  snapshot?: boolean
  /** fallbacks: alternative fields used when the primary is null (e.g. banks report
   *  netIncomeFromContinuingOps instead of netIncome) */
  rows: { field: string; label: string; fallbacks?: string[] }[]
  chart: { field: string; label: string; color: string; fallbacks?: string[] }[]
}

const STATEMENTS: StatementConfig[] = [
  {
    type: 'income_statement',
    label: 'DRE',
    rows: [
      { field: 'totalRevenue', label: 'Receita Total' },
      { field: 'costOfRevenue', label: 'Custos' },
      { field: 'grossProfit', label: 'Lucro Bruto' },
      { field: 'ebit', label: 'EBIT', fallbacks: ['cleanEbit'] },
      { field: 'financialResult', label: 'Resultado Financeiro' },
      { field: 'incomeBeforeTax', label: 'Lucro Antes de Impostos' },
      { field: 'incomeTaxExpense', label: 'Impostos' },
      // banks report netIncome as null and fill netIncomeFromContinuingOps instead
      { field: 'netIncome', label: 'Lucro Líquido', fallbacks: ['netIncomeFromContinuingOps', 'netIncomeApplicableToCommonShares'] },
    ],
    chart: [
      { field: 'totalRevenue', label: 'Receita', color: 'var(--accent)' },
      { field: 'netIncome', label: 'Lucro Líquido', color: '#22c55e', fallbacks: ['netIncomeFromContinuingOps', 'netIncomeApplicableToCommonShares'] },
    ],
  },
  {
    type: 'balance_sheet',
    label: 'Balanço Patrimonial',
    snapshot: true,
    rows: [
      { field: 'totalAssets', label: 'Ativo Total' },
      { field: 'totalCurrentAssets', label: 'Ativo Circulante' },
      { field: 'cash', label: 'Caixa' },
      { field: 'totalLiab', label: 'Passivo Total' },
      { field: 'currentLiabilities', label: 'Passivo Circulante' },
      { field: 'nonCurrentLiabilities', label: 'Passivo Não Circulante' },
      { field: 'shareholdersEquity', label: 'Patrimônio Líquido' },
    ],
    chart: [
      { field: 'totalAssets', label: 'Ativos', color: 'var(--accent)' },
      { field: 'totalLiab', label: 'Passivos', color: '#ef4444' },
      { field: 'shareholdersEquity', label: 'Patrimônio', color: '#22c55e' },
    ],
  },
  {
    type: 'cash_flow',
    label: 'Fluxo de Caixa',
    rows: [
      { field: 'operatingCashFlow', label: 'Caixa Operacional' },
      { field: 'investmentCashFlow', label: 'Caixa de Investimentos' },
      { field: 'financingCashFlow', label: 'Caixa de Financiamentos' },
      { field: 'freeCashFlow', label: 'Fluxo de Caixa Livre' },
      { field: 'increaseOrDecreaseInCash', label: 'Variação de Caixa' },
      { field: 'finalCashBalance', label: 'Saldo Final de Caixa' },
    ],
    chart: [
      { field: 'operatingCashFlow', label: 'Operacional', color: 'var(--accent)' },
      { field: 'freeCashFlow', label: 'FCL', color: '#22c55e' },
    ],
  },
  {
    type: 'value_added',
    label: 'DVA',
    rows: [
      { field: 'revenue', label: 'Receita' },
      { field: 'grossAddedValue', label: 'Valor Adicionado Bruto' },
      { field: 'netAddedValue', label: 'Valor Adicionado Líquido' },
      { field: 'addedValueToDistribute', label: 'Valor a Distribuir' },
      { field: 'teamRemuneration', label: 'Pessoal' },
      { field: 'taxes', label: 'Impostos' },
      { field: 'dividends', label: 'Dividendos' },
      { field: 'interestOnOwnEquity', label: 'JCP' },
      { field: 'retainedEarningsOrLoss', label: 'Lucros Retidos' },
    ],
    chart: [
      { field: 'teamRemuneration', label: 'Pessoal', color: 'var(--accent)' },
      { field: 'taxes', label: 'Impostos', color: '#f59e0b' },
      { field: 'dividends', label: 'Dividendos', color: '#22c55e' },
    ],
  },
]

function num(row: StatementRow, field: string, fallbacks?: string[]): number | null {
  const v = row[field]
  if (typeof v === 'number') return v
  for (const fb of fallbacks ?? []) {
    const alt = row[fb]
    if (typeof alt === 'number') return alt
  }
  return null
}

function StatementContent({ symbol, config }: { symbol: string; config: StatementConfig }) {
  const { rows, loading } = useStockStatements(symbol, config.type)

  const yearly = useMemo(
    () => rows
      .filter(r => (r.type ?? '').toLowerCase() === 'yearly')
      .sort((a, b) => b.endDate.localeCompare(a.endDate))
      .slice(0, 6),
    [rows],
  )

  const quarterly = useMemo(
    () => rows
      .filter(r => (r.type ?? '').toLowerCase() === 'quarterly')
      .sort((a, b) => b.endDate.localeCompare(a.endDate)),
    [rows],
  )

  const chartData = useMemo(() => {
    const base: Record<string, unknown>[] = [...yearly].reverse().map(r => {
      const entry: Record<string, unknown> = { year: r.endDate.slice(0, 4) }
      for (const c of config.chart) entry[c.field] = num(r, c.field, c.fallbacks)
      return entry
    })

    const currentYear = String(new Date().getFullYear())

    if (config.snapshot) {
      // Balance sheet: values are point-in-time — show the latest quarterly position
      const latest = quarterly[0]
      if (latest && !yearly.some(y => y.endDate >= latest.endDate)) {
        const entry: Record<string, unknown> = { year: 'Atual' }
        for (const c of config.chart) entry[c.field] = num(latest, c.field, c.fallbacks)
        base.push(entry)
      }
      return base
    }

    // Últimos 12 meses: sum of the last 4 quarters (only when all 4 report the field)
    const last4 = quarterly.slice(0, 4)
    if (last4.length === 4) {
      const entry: Record<string, unknown> = { year: '12M' }
      for (const c of config.chart) {
        const vals = last4.map(q => num(q, c.field, c.fallbacks))
        entry[c.field] = vals.every(v => v != null)
          ? (vals as number[]).reduce((s, v) => s + v, 0)
          : null
      }
      base.push(entry)
    }

    // Ano atual: sum of the current year's reported quarters (partial year)
    const ytd = quarterly.filter(q => q.endDate.startsWith(currentYear))
    if (ytd.length > 0) {
      const entry: Record<string, unknown> = { year: 'Atual' }
      for (const c of config.chart) {
        const vals = ytd.map(q => num(q, c.field, c.fallbacks)).filter((v): v is number => v != null)
        entry[c.field] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) : null
      }
      base.push(entry)
    }

    return base
  }, [yearly, quarterly, config])

  if (loading) return <div className="ta-statement-empty">Carregando…</div>
  if (yearly.length === 0) return <div className="ta-statement-empty">Sem dados disponíveis para este demonstrativo.</div>

  return (
    <>
      {chartData.length > 1 && (
        <div className="ta-statement-chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48}
                tickFormatter={v => fmtBig(Number(v))} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                formatter={(v: unknown, name: unknown) => [`R$ ${fmtBig(Number(v))}`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {config.chart.map(c => (
                <Bar key={c.field} dataKey={c.field} name={c.label} fill={c.color} radius={[3, 3, 0, 0]} maxBarSize={36} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {!config.snapshot && (
            <div className="ta-sector-note" style={{ padding: '0.25rem 0.25rem 0' }}>
              12M: soma dos últimos 4 trimestres · Atual: trimestres acumulados de {new Date().getFullYear()}
            </div>
          )}
        </div>
      )}

      <div className="ta-statement-table-wrap">
        <table className="ta-statement-table">
          <thead>
            <tr>
              <th>Conta</th>
              {yearly.map(r => <th key={r.endDate} className="right">{r.endDate.slice(0, 4)}</th>)}
            </tr>
          </thead>
          <tbody>
            {config.rows.map(rowCfg => {
              const hasAny = yearly.some(r => num(r, rowCfg.field, rowCfg.fallbacks) != null)
              if (!hasAny) return null
              return (
                <tr key={rowCfg.field}>
                  <td>{rowCfg.label}</td>
                  {yearly.map(r => {
                    const v = num(r, rowCfg.field, rowCfg.fallbacks)
                    return (
                      <td key={r.endDate} className={`right ${v != null && v < 0 ? 'ta-statement-neg' : ''}`}>
                        {v != null ? fmtBig(v) : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function StatementsSection({ symbol }: { symbol: string }) {
  const [active, setActive] = useState<StatementConfig>(STATEMENTS[0])

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Demonstrativos Financeiros</div>
        <div className="ta-range-btns">
          {STATEMENTS.map(s => (
            <button
              key={s.type}
              className={`ta-range-btn ${active.type === s.type ? 'ta-range-btn--active' : ''}`}
              onClick={() => setActive(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <StatementContent symbol={symbol} config={active} />
    </div>
  )
}
