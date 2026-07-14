import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickers } from '../../hooks/useTickers'
import { useStockAnalysis } from '../../hooks/useStockAnalysis'
import { TickerSelect } from '../../components/TickerSelect/TickerSelect'
import { TickerLogo } from '../../components/TickerLogo/TickerLogo'
import { KEY_INDICATORS, fmtIndicator } from '../TickerAnalysis/StockAdvanced'
import type { StockAnalysisFull } from '../../types/StockAnalysis'
import './Compare.css'

/** Indicators where a LOWER value wins the comparison. */
const LOWER_BETTER = new Set(['pl', 'pvp', 'psr', 'evEbit', 'pEbit', 'pAtivo', 'pegRatio', 'passivosAtivos'])
/** Indicators where highlighting a "winner" makes no sense. */
const NEUTRAL = new Set(['beta', 'vpa', 'lpa', 'payout', 'pAtivoCircLiq', 'pCapGiro'])

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return '—'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function bestIndex(key: string, values: (number | null)[]): number {
  if (NEUTRAL.has(key)) return -1
  const lower = LOWER_BETTER.has(key)
  let best = -1
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (v == null) continue
    // lower-is-better ratios only make sense when positive (negative P/L = loss)
    if (lower && v <= 0) continue
    if (best === -1) { best = i; continue }
    const b = values[best] as number
    if (lower ? v < b : v > b) best = i
  }
  // a single competitor is not a "winner"
  const nonNull = values.filter(v => v != null).length
  return nonNull >= 2 ? best : -1
}

function CompareColumn({ symbol, data }: { symbol: string; data: StockAnalysisFull | null }) {
  const navigate = useNavigate()
  const q = data?.quote
  const up = (q?.changePercent ?? 0) >= 0
  return (
    <div className="cmp-stock-card" onClick={() => navigate(`/ticker/${symbol}`)}>
      <TickerLogo className="cmp-stock-logo" src={q?.logoUrl} alt={symbol} />
      <div className="cmp-stock-symbol">{symbol}</div>
      <div className="cmp-stock-name">{q?.longName ?? q?.shortName ?? ''}</div>
      <div className="cmp-stock-price">{fmtBRL(q?.price)}</div>
      {q?.changePercent != null && (
        <div className={`cmp-stock-change ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(q.changePercent).toFixed(2)}%
        </div>
      )}
    </div>
  )
}

export function Compare() {
  const { tickers } = useTickers()
  const stocks = tickers.filter(t =>
    ['stock', 'unit'].includes((t.subType ?? '').toLowerCase()))

  const [symbolA, setSymbolA] = useState('')
  const [symbolB, setSymbolB] = useState('')
  const [symbolC, setSymbolC] = useState('')

  const { data: dataA } = useStockAnalysis(symbolA || undefined)
  const { data: dataB } = useStockAnalysis(symbolB || undefined)
  const { data: dataC } = useStockAnalysis(symbolC || undefined)

  const columns = [
    { symbol: symbolA, data: symbolA ? dataA : null },
    { symbol: symbolB, data: symbolB ? dataB : null },
    { symbol: symbolC, data: symbolC ? dataC : null },
  ].filter(c => c.symbol)

  const rows = KEY_INDICATORS.filter(d =>
    columns.some(c => c.data?.keyIndicators?.[d.key] != null))

  return (
    <div className="cmp-page">
      <h1 className="cmp-title">Comparador de Ações</h1>
      <p className="cmp-subtitle">Escolha 2 ou 3 ações para comparar os indicadores fundamentalistas lado a lado.</p>

      <div className="cmp-selects">
        <TickerSelect tickers={stocks} value={symbolA} onChange={setSymbolA} />
        <TickerSelect tickers={stocks} value={symbolB} onChange={setSymbolB} />
        <TickerSelect tickers={stocks} value={symbolC} onChange={setSymbolC} />
      </div>

      {columns.length >= 2 ? (
        <>
          <div className="cmp-stock-cards" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
            {columns.map(c => <CompareColumn key={c.symbol} symbol={c.symbol} data={c.data} />)}
          </div>

          <div className="ta-section-card">
            <div className="ta-section-title">Indicadores lado a lado</div>
            <div className="cmp-table-wrap">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    {columns.map(c => <th key={c.symbol} className="right">{c.symbol}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(d => {
                    const values = columns.map(c => c.data?.keyIndicators?.[d.key] ?? null)
                    const best = bestIndex(d.key, values)
                    return (
                      <tr key={d.key}>
                        <td>
                          <span className="cmp-ind-label" title={d.help}>{d.label}</span>
                          <span className="cmp-ind-desc">{d.desc}</span>
                        </td>
                        {values.map((v, i) => (
                          <td key={i} className={`right ${i === best ? 'cmp-best' : ''} ${v != null && v < 0 ? 'cmp-neg' : ''}`}>
                            {v != null ? fmtIndicator(v, d.kind) : '—'}
                            {i === best && <span className="cmp-best-badge">✦</span>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="ta-sector-note">
              ✦ marca o melhor valor do indicador entre as ações comparadas (P/L, P/VP, PSR, EV/EBIT, P/EBIT, P/Ativo, PEG e Passivos/Ativos são melhores quanto menores).
            </div>
          </div>
        </>
      ) : (
        <div className="cmp-empty">Selecione pelo menos duas ações para comparar.</div>
      )}
    </div>
  )
}
