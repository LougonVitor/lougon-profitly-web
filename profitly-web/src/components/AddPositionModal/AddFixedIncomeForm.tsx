import { useState } from 'react'
import { useFixedIncome } from '../../hooks/useFixedIncome'
import { useI18n } from '../../i18n/I18nContext'
import type { FixedIncomeIndexer, FixedIncomeInstrumentType, WalletSummary } from '../../types/WalletSummary'

interface AddFixedIncomeFormProps {
  walletId: string
  onClose: () => void
  onSuccess: (updated: WalletSummary) => void
}

const INSTRUMENT_TYPES: FixedIncomeInstrumentType[] = ['CDB', 'LCI', 'LCA', 'LC', 'LF', 'RDB']
const INDEXERS: FixedIncomeIndexer[] = ['CDI', 'SELIC', 'IPCA', 'PREFIXADO']

export function AddFixedIncomeForm({ walletId, onClose, onSuccess }: AddFixedIncomeFormProps) {
  const { addFixedIncomeEntry, loading, error } = useFixedIncome()
  const { t } = useI18n()
  const fi = t.fixedIncome

  const [issuer, setIssuer] = useState('')
  const [instrumentType, setInstrumentType] = useState<FixedIncomeInstrumentType>('CDB')
  const [indexer, setIndexer] = useState<FixedIncomeIndexer>('CDI')
  const [ratePercent, setRatePercent] = useState('')
  const [dailyLiquidity, setDailyLiquidity] = useState(false)
  const [principal, setPrincipal] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().substring(0, 10))
  const [maturityDate, setMaturityDate] = useState('')

  const rateValue = parseFloat(ratePercent.replace(',', '.')) || 0
  const principalValue = parseFloat(principal.replace(',', '.')) || 0

  const indexerLabels: Record<FixedIncomeIndexer, string> = {
    CDI: fi.indexerCdi,
    SELIC: fi.indexerSelic,
    IPCA: fi.indexerIpca,
    PREFIXADO: fi.indexerPrefixado,
  }

  const rateLabel = indexer === 'CDI' ? `${fi.rateCdi} (%)`
    : indexer === 'SELIC' ? `${fi.rateSelic} (%)`
    : indexer === 'IPCA' ? fi.rateIpca
    : fi.ratePrefixado

  const valid = issuer.trim() !== '' && rateValue > 0 && principalValue > 0 && transactionDate !== ''
    && (dailyLiquidity || (maturityDate !== '' && maturityDate > transactionDate))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    const updated = await addFixedIncomeEntry(walletId, {
      issuer: issuer.trim(),
      instrumentType,
      indexer,
      ratePercent: rateValue,
      dailyLiquidity,
      principal: principalValue,
      transactionDate,
      maturityDate: dailyLiquidity ? null : maturityDate,
    })
    if (updated) onSuccess(updated)
  }

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="modal-row modal-row--two">
        <div className="modal-field">
          <label className="modal-label">{fi.issuer}</label>
          <input
            className="modal-input"
            type="text"
            value={issuer}
            onChange={e => setIssuer(e.target.value)}
            required
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">{fi.instrumentType}</label>
          <select
            className="modal-input"
            value={instrumentType}
            onChange={e => setInstrumentType(e.target.value as FixedIncomeInstrumentType)}
          >
            {INSTRUMENT_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="modal-row modal-row--two">
        <div className="modal-field">
          <label className="modal-label">{fi.indexer}</label>
          <select
            className="modal-input"
            value={indexer}
            onChange={e => setIndexer(e.target.value as FixedIncomeIndexer)}
          >
            {INDEXERS.map(opt => <option key={opt} value={opt}>{indexerLabels[opt]}</option>)}
          </select>
        </div>

        <div className="modal-field">
          <label className="modal-label">{rateLabel}</label>
          <input
            className="modal-input"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={ratePercent}
            onChange={e => setRatePercent(e.target.value.replace(/[^\d.,]/g, ''))}
            required
          />
        </div>
      </div>

      <div className="modal-row modal-row--two">
        <div className="modal-field">
          <label className="modal-label">{fi.principal}</label>
          <input
            className="modal-input"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={principal}
            onChange={e => setPrincipal(e.target.value.replace(/[^\d.,]/g, ''))}
            required
          />
        </div>

        <div className="modal-field modal-field--toggle">
          <label className="modal-label">{fi.dailyLiquidity}</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={dailyLiquidity}
              onChange={e => setDailyLiquidity(e.target.checked)}
            />
            <span className="toggle-switch-track" />
          </label>
        </div>
      </div>

      <div className="modal-row modal-row--two">
        <div className="modal-field">
          <label className="modal-label">{fi.transactionDate}</label>
          <input
            className="modal-input"
            type="date"
            value={transactionDate}
            onChange={e => setTransactionDate(e.target.value)}
            required
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">{fi.maturityDate}</label>
          <input
            className="modal-input"
            type="date"
            value={dailyLiquidity ? '' : maturityDate}
            onChange={e => setMaturityDate(e.target.value)}
            min={transactionDate}
            disabled={dailyLiquidity}
            required={!dailyLiquidity}
          />
        </div>
      </div>

      <div className="modal-total">
        <span className="modal-total-label">{fi.totalValue}</span>
        <span className="modal-total-value">
          {principalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {error && <div className="modal-error">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="modal-btn-cancel" onClick={onClose}>
          {t.modal.cancel}
        </button>
        <button type="submit" className="modal-btn-submit" disabled={loading || !valid}>
          {loading ? fi.adding : fi.add}
        </button>
      </div>
    </form>
  )
}
