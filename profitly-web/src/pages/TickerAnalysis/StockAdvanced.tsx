import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts'
import { useStockStatements, useIndicatorHistory } from '../../hooks/useStockAnalysis'
import type { IndicatorHistoryData } from '../../hooks/useStockAnalysis'
import type {
  StockAnalysisFull, StockFinancials, SectorComparison, StatementRow, StatementType,
  DividendAnalysis,
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
    <div className="ta-section-card">
      <div className="ta-section-title">Endividamento e Caixa</div>
      <div className="ta-info-rows">
        <div className="ta-info-row"><span>Receita Total</span><strong>R$ {fmtBig(f.totalRevenue)}</strong></div>
        <div className="ta-info-row"><span>EBITDA</span><strong>R$ {fmtBig(f.ebitda)}</strong></div>
        <div className="ta-info-row"><span>Lucro Bruto</span><strong>R$ {fmtBig(f.grossProfits)}</strong></div>
        <div className="ta-info-row"><span>Caixa Total</span><strong>R$ {fmtBig(f.totalCash)}</strong></div>
        <div className="ta-info-row"><span>Dívida Total</span><strong>R$ {fmtBig(f.totalDebt)}</strong></div>
        <div className="ta-info-row"><span>Dívida / Patrimônio</span><strong>{fmt(f.debtToEquity)}</strong></div>
        <div className="ta-info-row"><span>Fluxo de Caixa Livre</span><strong>R$ {fmtBig(f.freeCashflow)}</strong></div>
        <div className="ta-info-row"><span>Fluxo de Caixa Operacional</span><strong>R$ {fmtBig(f.operatingCashflow)}</strong></div>
      </div>
    </div>
  )
}

// ── Graham fair price ────────────────────────────────────────────────────────

interface FairPriceMethod {
  key: string
  label: string
  price: number
  help: string
}

export function GrahamCard({ indicators, quote }: {
  indicators: Record<string, number | null> | null
  quote: StockAnalysisFull['quote']
}) {
  const price = quote?.price
  if (price == null || price <= 0) return null

  const lpa = indicators?.lpa
  const vpa = indicators?.vpa
  const graham = lpa != null && vpa != null && lpa > 0 && vpa > 0
    ? Math.sqrt(22.5 * lpa * vpa)
    : null

  const methods: FairPriceMethod[] = [
    graham != null && {
      key: 'graham',
      label: 'Graham',
      price: graham,
      help: 'Fórmula de Benjamin Graham: √(22,5 × LPA × VPA). Estima o preço máximo racional assumindo P/L de 15 e P/VP de 1,5. Não considera crescimento nem qualidade da empresa.',
    },
    indicators?.precoTetoBazin != null && indicators.precoTetoBazin > 0 && {
      key: 'bazin',
      label: 'Bazin (preço teto)',
      price: indicators.precoTetoBazin,
      help: 'Método de Décio Bazin: média dos dividendos anuais dos últimos 3 anos ÷ 6%. É o preço máximo para garantir um yield mínimo de 6% ao ano. Focado em empresas pagadoras de dividendos.',
    },
    indicators?.precoJustoGordon != null && indicators.precoJustoGordon > 0 && {
      key: 'gordon',
      label: 'Gordon (DDM)',
      price: indicators.precoJustoGordon,
      help: 'Modelo de desconto de dividendos: dividendos projetados ÷ (taxa de desconto − crescimento). Premissas: desconto de 12% a.a. e crescimento pelo CAGR dos dividendos, limitado a 5% a.a. Muito sensível às premissas.',
    },
  ].filter((m): m is FairPriceMethod => Boolean(m))

  if (methods.length === 0) return null

  const avgPrice = methods.reduce((s, m) => s + m.price, 0) / methods.length
  // how far the CURRENT price sits from the average fair price (negative = below = cheap)
  const priceVsAvg = price / avgPrice - 1
  const avgPositive = priceVsAvg <= 0

  return (
    <div className="ta-section-card">
      <div className="ta-section-header">
        <div className="ta-section-title">Preço Justo</div>
        <span className="ta-sector-badge">Preço atual: R$ {fmt(price)}</span>
      </div>
      <div className="ta-fair-grid" style={{ gridTemplateColumns: `repeat(${methods.length}, 1fr)` }}>
        {methods.map(m => {
          const upside = m.price / price - 1
          const positive = upside >= 0
          return (
            <div key={m.key} className="ta-fair-method">
              <div className="ta-fair-method-header">
                <span className="ta-key-label">{m.label}</span>
                <span className="ta-metric-help ta-metric-help--inline" tabIndex={0}>
                  ?
                  <span className="ta-metric-help-tip">{m.help}</span>
                </span>
              </div>
              <div className="ta-key-value">R$ {fmt(m.price)}</div>
              <div className={`ta-fair-upside ${positive ? 'ta-graham-up' : 'ta-key-value--neg'}`}>
                {positive ? '▲ +' : '▼ '}{fmt(upside * 100)}% {positive ? 'de potencial' : 'sobrepreço'}
              </div>
              <div className="ta-graham-bar">
                <div
                  className={`ta-graham-bar-fill ${positive ? 'ta-graham-bar-fill--up' : 'ta-graham-bar-fill--down'}`}
                  style={{ width: `${Math.min(100, (price / m.price) * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className={`ta-fair-avg ${avgPositive ? 'ta-fair-avg--up' : 'ta-fair-avg--down'}`}>
        <div>
          <span className="ta-key-label">Média dos {methods.length} métodos</span>
          <div className="ta-key-value">R$ {fmt(avgPrice)}</div>
        </div>
        <div className={`ta-fair-avg-verdict ${avgPositive ? 'ta-graham-up' : 'ta-key-value--neg'}`}>
          {avgPositive
            ? <>▲ Na média, o preço atual está <strong>{fmt(Math.abs(priceVsAvg) * 100)}% abaixo</strong> do preço justo</>
            : <>▼ Na média, o preço atual está <strong>{fmt(Math.abs(priceVsAvg) * 100)}% acima</strong> do preço justo</>}
        </div>
      </div>
      <div className="ta-sector-note">
        Modelos simplificados de valuation — use como referência, não como recomendação. Cada método tem premissas próprias (veja o "?").
      </div>
    </div>
  )
}

// ── upcoming dividends agenda ────────────────────────────────────────────────

function fmtEventDate(d: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}

export function UpcomingDividends({ dividends }: { dividends: DividendAnalysis | null }) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (dividends?.events ?? [])
    .filter(e => e.rate != null && e.rate > 0
      && ((e.paymentDate ?? '') > today || (e.lastDatePrior ?? '') > today))
    .sort((a, b) => (a.paymentDate ?? a.lastDatePrior ?? '').localeCompare(b.paymentDate ?? b.lastDatePrior ?? ''))
    .slice(0, 8)

  if (upcoming.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Agenda de Proventos</div>
      <div className="ta-dividends-table">
        <table>
          <thead>
            <tr>
              <th>Data com</th>
              <th>Pagamento</th>
              <th>Tipo</th>
              <th className="right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((e, i) => (
              <tr key={i}>
                <td>{fmtEventDate(e.lastDatePrior)}</td>
                <td>{fmtEventDate(e.paymentDate)}</td>
                <td><span className="ta-div-badge">{e.label ?? '—'}</span></td>
                <td className="right ta-div-value">R$ {(e.rate ?? 0).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ta-sector-note">
        Proventos já anunciados com data-com ou pagamento futuros.
      </div>
    </div>
  )
}

// ── key indicators grid (Investidor10-style) ─────────────────────────────────

export interface KeyIndicatorDef {
  key: string
  label: string
  desc: string
  help: string
  kind: 'num' | 'pct' | 'brl'
}

interface HistoryLocation {
  source: 'statistics' | 'financialData'
  field: string
  fallbacks?: string[]
}

/** Where each indicator lives in the yearly history (only those brapi provides in mode=history). */
const INDICATOR_HISTORY: Record<string, HistoryLocation> = {
  pl:                { source: 'statistics',    field: 'trailingPE' },
  pvp:               { source: 'statistics',    field: 'priceToBook' },
  dividendYield:     { source: 'statistics',    field: 'dividendYield' },
  vpa:               { source: 'statistics',    field: 'bookValue' },
  lpa:               { source: 'statistics',    field: 'earningsPerShare', fallbacks: ['trailingEps'] },
  pegRatio:          { source: 'statistics',    field: 'pegRatio' },
  margemLiquida:     { source: 'financialData', field: 'profitMargins' },
  margemBruta:       { source: 'financialData', field: 'grossMargins' },
  margemEbitda:      { source: 'financialData', field: 'ebitdaMargins' },
  margemOperacional: { source: 'financialData', field: 'operatingMargins' },
  crescReceita:      { source: 'financialData', field: 'revenueGrowthAnnual', fallbacks: ['revenueGrowth'] },
  crescLucro:        { source: 'financialData', field: 'earningsGrowthAnnual', fallbacks: ['earningsGrowth'] },
  roe:               { source: 'financialData', field: 'returnOnEquity' },
  roa:               { source: 'financialData', field: 'returnOnAssets' },
  liquidezCorrente:  { source: 'financialData', field: 'currentRatio' },
}

export const KEY_INDICATORS: KeyIndicatorDef[] = [
  { key: 'pl',              label: 'P/L',              desc: 'Preço / Lucro por ação',            kind: 'num',
    help: 'Preço dividido pelo lucro por ação dos últimos 12 meses. Indica quantos anos de lucro o mercado paga pela ação — quanto menor, mais barata.' },
  { key: 'psr',             label: 'P/Receita (PSR)',  desc: 'Valor de mercado / Receita',        kind: 'num',
    help: 'Valor de mercado dividido pela receita. Útil para comparar empresas com lucros voláteis ou negativos.' },
  { key: 'pvp',             label: 'P/VP',             desc: 'Preço / Valor patrimonial',         kind: 'num',
    help: 'Preço dividido pelo valor patrimonial por ação. Abaixo de 1, a ação negocia por menos que o patrimônio líquido da empresa.' },
  { key: 'dividendYield',   label: 'Dividend Yield',   desc: 'Dividendos 12M / Preço',            kind: 'pct',
    help: 'Percentual do preço da ação distribuído em dividendos e JCP nos últimos 12 meses.' },
  { key: 'payout',          label: 'Payout',           desc: 'Dividendos 12M / Lucro por ação',   kind: 'pct',
    help: 'Percentual do lucro distribuído aos acionistas. Payout alto sobra menos para reinvestir; acima de 100% a empresa distribui mais do que lucra.' },
  { key: 'margemLiquida',   label: 'Margem Líquida',   desc: 'Lucro líquido / Receita',           kind: 'pct',
    help: 'Percentual da receita que se converte em lucro líquido, após todos os custos, despesas e impostos.' },
  { key: 'margemBruta',     label: 'Margem Bruta',     desc: 'Lucro bruto / Receita',             kind: 'pct',
    help: 'Percentual da receita que sobra após os custos diretos de produção. Mede a rentabilidade do produto em si.' },
  { key: 'margemEbit',      label: 'Margem EBIT',      desc: 'EBIT / Receita',                    kind: 'pct',
    help: 'Lucro operacional (antes de juros e impostos) sobre a receita. Mede a eficiência da operação sem efeitos financeiros.' },
  { key: 'margemEbitda',    label: 'Margem EBITDA',    desc: 'EBITDA / Receita',                  kind: 'pct',
    help: 'EBITDA sobre a receita. Aproxima a geração de caixa operacional, ignorando depreciação e amortização.' },
  { key: 'margemOperacional', label: 'Margem Operacional', desc: 'Resultado operacional / Receita', kind: 'pct',
    help: 'Percentual da receita que vira resultado operacional, após custos e despesas operacionais.' },
  { key: 'crescReceita',    label: 'Cresc. Receita',   desc: 'Crescimento anual da receita',      kind: 'pct',
    help: 'Crescimento da receita no último ano em relação ao anterior.' },
  { key: 'crescLucro',      label: 'Cresc. Lucro',     desc: 'Crescimento anual do lucro',        kind: 'pct',
    help: 'Crescimento do lucro líquido no último ano em relação ao anterior.' },
  { key: 'evEbit',          label: 'EV/EBIT',          desc: 'Enterprise Value / EBIT',           kind: 'num',
    help: 'Valor da firma (mercado + dívida líquida) dividido pelo lucro operacional. Quanto menor, mais barata a operação da empresa.' },
  { key: 'pEbit',           label: 'P/EBIT',           desc: 'Valor de mercado / EBIT',           kind: 'num',
    help: 'Valor de mercado dividido pelo lucro operacional (EBIT).' },
  { key: 'pAtivo',          label: 'P/Ativo',          desc: 'Valor de mercado / Ativo total',    kind: 'num',
    help: 'Valor de mercado dividido pelo ativo total. Mostra quanto o mercado paga por cada real de ativos da empresa.' },
  { key: 'pCapGiro',        label: 'P/Cap. Giro',      desc: 'Valor de mercado / Capital de giro', kind: 'num',
    help: 'Valor de mercado dividido pelo capital de giro (ativo circulante − passivo circulante).' },
  { key: 'pAtivoCircLiq',   label: 'P/Ativo Circ. Liq.', desc: 'Valor de mercado / ACL',          kind: 'num',
    help: 'Valor de mercado dividido pelo ativo circulante líquido (ativo circulante − passivo total). Negativo é comum e indica que os passivos superam o circulante.' },
  { key: 'vpa',             label: 'VPA',              desc: 'Valor patrimonial por ação',        kind: 'brl',
    help: 'Patrimônio líquido dividido pelo número de ações — quanto do patrimônio "pertence" a cada ação.' },
  { key: 'lpa',             label: 'LPA',              desc: 'Lucro por ação',                    kind: 'brl',
    help: 'Lucro líquido dos últimos 12 meses dividido pelo número de ações.' },
  { key: 'beta',            label: 'Beta',             desc: 'Volatilidade vs mercado',           kind: 'num',
    help: 'Volatilidade em relação ao mercado. Acima de 1, a ação oscila mais que o Ibovespa; abaixo de 1, oscila menos.' },
  { key: 'pegRatio',        label: 'PEG Ratio',        desc: 'P/L / Crescimento do lucro',        kind: 'num',
    help: 'P/L dividido pelo crescimento esperado do lucro. Próximo de 1 sugere preço justo em relação ao crescimento.' },
  { key: 'giroAtivos',      label: 'Giro Ativos',      desc: 'Receita / Ativo total',             kind: 'num',
    help: 'Receita dividida pelo ativo total. Mede a eficiência da empresa em gerar receita com seus ativos.' },
  { key: 'roe',             label: 'ROE',              desc: 'Retorno sobre patrimônio',          kind: 'pct',
    help: 'Lucro líquido sobre o patrimônio líquido. Mede quanto a empresa gera de retorno com o capital dos acionistas.' },
  { key: 'roic',            label: 'ROIC',             desc: 'Retorno sobre capital investido',   kind: 'pct',
    help: 'Retorno sobre todo o capital investido (próprio + terceiros). Acima do custo de capital, a empresa cria valor.' },
  { key: 'roa',             label: 'ROA',              desc: 'Retorno sobre ativos',              kind: 'pct',
    help: 'Lucro líquido sobre o ativo total. Mede a eficiência no uso dos ativos para gerar lucro.' },
  { key: 'patrimonioAtivos', label: 'Patrimônio/Ativos', desc: 'Patrimônio líquido / Ativos',     kind: 'num',
    help: 'Fração dos ativos financiada com capital próprio. Quanto maior, menos alavancada a empresa.' },
  { key: 'passivosAtivos',  label: 'Passivos/Ativos',  desc: 'Passivo total / Ativos',            kind: 'num',
    help: 'Fração dos ativos financiada com capital de terceiros (dívidas e obrigações).' },
  { key: 'liquidezCorrente', label: 'Liquidez Corrente', desc: 'Ativo circ. / Passivo circ.',     kind: 'num',
    help: 'Ativo circulante dividido pelo passivo circulante. Acima de 1 indica capacidade de honrar as obrigações de curto prazo.' },
  { key: 'cagrReceitas5a',  label: 'CAGR Receitas 5A', desc: 'Cresc. anual da receita (5 anos)',  kind: 'pct',
    help: 'Crescimento anual composto da receita nos últimos 5 anos.' },
  { key: 'cagrLucros5a',    label: 'CAGR Lucros 5A',   desc: 'Cresc. anual do lucro (5 anos)',    kind: 'pct',
    help: 'Crescimento anual composto do lucro líquido nos últimos 5 anos.' },
]

export function fmtIndicator(v: number, kind: KeyIndicatorDef['kind']): string {
  if (kind === 'pct') return `${fmt(v * 100)}%`
  if (kind === 'brl') return `R$ ${fmt(v)}`
  return fmt(v)
}

function IndicatorHistoryChart({ def, history }: {
  def: KeyIndicatorDef
  history: IndicatorHistoryData | null
}) {
  const loc = INDICATOR_HISTORY[def.key]
  const points = useMemo(() => {
    if (!loc || !history) return []
    const rows = history[loc.source] ?? []
    return rows
      .filter(r => (r.type ?? '').toLowerCase() === 'yearly' && r.endDate)
      .map(r => {
        const raw = num(r as StatementRow, loc.field, loc.fallbacks)
        return { year: String(r.endDate).slice(0, 4), value: raw }
      })
      .filter((p): p is { year: string; value: number } => p.value != null)
      .sort((a, b) => a.year.localeCompare(b.year))
  }, [loc, history])

  const fmtValue = (v: number) => fmtIndicator(v, def.kind)

  if (history == null) return <div className="ta-statement-empty">Carregando histórico…</div>
  if (points.length < 2) return <div className="ta-statement-empty">Sem histórico disponível para este indicador.</div>

  return (
    <div className="ta-key-history-chart">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60}
            tickFormatter={v => fmtValue(Number(v))} />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(v: unknown) => [fmtValue(Number(v)), def.label]}
            labelFormatter={y => `Ano ${y}`}
          />
          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2}
            dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KeyIndicatorsSection({ symbol, indicators }: {
  symbol: string
  indicators: Record<string, number | null> | null
}) {
  const [selected, setSelected] = useState<KeyIndicatorDef | null>(null)
  const { data: history } = useIndicatorHistory(symbol, selected != null)

  if (!indicators) return null
  const available = KEY_INDICATORS.filter(d => indicators[d.key] != null)
  if (available.length === 0) return null

  return (
    <div className="ta-section-card">
      <div className="ta-section-title">Indicadores</div>
      <div className="ta-key-grid">
        {available.map(d => {
          const v = indicators[d.key] as number
          const hasHistory = INDICATOR_HISTORY[d.key] != null
          const active = selected?.key === d.key
          return (
            <div key={d.key} className={`ta-key-card ${active ? 'ta-key-card--active' : ''}`}>
              <span className="ta-metric-help" tabIndex={0} aria-label={d.help}>
                ?
                <span className="ta-metric-help-tip">{d.help}</span>
              </span>
              {hasHistory && (
                <button
                  className={`ta-key-chart-btn ${active ? 'ta-key-chart-btn--active' : ''}`}
                  title={`Histórico anual de ${d.label}`}
                  onClick={() => setSelected(active ? null : d)}
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                    <path d="M4 20h16v2H2V2h2v18zm3-9h3v7H7v-7zm5-6h3v13h-3V5zm5 3h3v10h-3V8z"/>
                  </svg>
                </button>
              )}
              <div className="ta-key-label">{d.label}</div>
              <div className={`ta-key-value ${v < 0 ? 'ta-key-value--neg' : ''}`}>
                {fmtIndicator(v, d.kind)}
              </div>
              <div className="ta-key-desc">{d.desc}</div>
            </div>
          )
        })}
      </div>
      {selected && (
        <div className="ta-key-history">
          <div className="ta-key-history-header">
            <span className="ta-key-history-title">{selected.label} — histórico anual</span>
            <button className="ta-key-history-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <IndicatorHistoryChart def={selected} history={history} />
        </div>
      )}
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
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
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
