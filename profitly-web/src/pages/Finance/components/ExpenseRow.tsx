import type { Expense, EditCell, EditField } from '../types'
import { TYPE_LABELS, TYPE_COLORS, STATUS_LABELS, ALL_TYPES } from '../constants'
import { fmtBRL } from '../helpers'

interface ExpenseRowProps {
  exp: Expense
  editCell: EditCell | null
  editCellVal: string
  onStartEdit: (id:number, field:EditField, val:string) => void
  onEditChange: (v:string) => void
  onCommit: () => void
  onCancelEdit: () => void
  onMarkPaid: (exp:Expense) => void
  onDelete: (id:number) => void
}

export function ExpenseRow({ exp, editCell, editCellVal, onStartEdit, onEditChange, onCommit, onCancelEdit, onMarkPaid, onDelete }: ExpenseRowProps) {
  const isEditingTitle = editCell?.id === exp.id && editCell.field === 'title'
  const isEditingEst   = editCell?.id === exp.id && editCell.field === 'estimated'
  const isEditingReal  = editCell?.id === exp.id && editCell.field === 'real'
  const isEditingType  = editCell?.id === exp.id && editCell.field === 'type'

  return (
    <tr className={`fin-row ${exp.recurring?'fin-row--recurring':''} fin-animate-row`}>
      <td className="fin-cell-title">
        {isEditingTitle ? (
          <InlineTextCell val={editCellVal} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
        ) : (
          <span className="fin-editable-cell" onClick={()=>onStartEdit(exp.id,'title',exp.title)} title="Clique para editar">
            {exp.title}
          </span>
        )}
      </td>
      <td>
        {isEditingEst ? (
          <InlineNumberCell value={exp.estimatedValue} editing={true} editVal={editCellVal}
            onStart={()=>{}} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
        ) : (
          <span className="fin-editable-cell" onClick={()=>onStartEdit(exp.id,'estimated',(exp.estimatedValue??'').toString())} title="Clique para editar">
            {fmtBRL(exp.estimatedValue)}
          </span>
        )}
      </td>
      <td className="fin-cell-real fin-td--center">
        <div className="fin-real-cell">
          {isEditingReal ? (
            <InlineNumberCell value={exp.realValue} editing={true} editVal={editCellVal}
              onStart={()=>{}} onChange={onEditChange} onCommit={onCommit} onCancel={onCancelEdit} />
          ) : (
            <span className="fin-editable-cell fin-editable-cell--real" onClick={()=>onStartEdit(exp.id,'real',exp.realValue.toString())} title="Clique para editar">
              {fmtBRL(exp.realValue)}
            </span>
          )}
          {exp.estimatedValue != null && exp.realValue < exp.estimatedValue && (
            <button className="fin-pay-btn" onClick={()=>onMarkPaid(exp)} title="Marcar como pago (preencher com o valor esperado)">✓</button>
          )}
        </div>
      </td>
      <td className="fin-td--center">
        {isEditingType ? (
          <select
            className="fin-inline-select"
            autoFocus
            value={editCellVal}
            onChange={e=>onEditChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancelEdit() }}
          >
            {ALL_TYPES.filter(t=>t!=='INVESTMENT').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        ) : (
          <span className="fin-type-badge fin-editable-cell"
            style={{background:TYPE_COLORS[exp.type]+'22', color:TYPE_COLORS[exp.type]}}
            onClick={()=>onStartEdit(exp.id,'type',exp.type)}
            title="Clique para alterar"
          >
            {TYPE_LABELS[exp.type]}
          </span>
        )}
      </td>
      <td className="fin-td--center">
        <span className={`fin-status-badge fin-status-badge--${exp.status.toLowerCase()}`}>
          {STATUS_LABELS[exp.status]}
        </span>
      </td>
      <td>
        <button className="fin-del-btn" onClick={()=>onDelete(exp.id)} title="Remover">✕</button>
      </td>
    </tr>
  )
}

function InlineTextCell({ val, onChange, onCommit, onCancel }: {
  val: string; onChange:(v:string)=>void; onCommit:()=>void; onCancel:()=>void
}) {
  return (
    <input
      className="fin-inline-input"
      autoFocus
      value={val}
      onChange={e=>onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancel() }}
    />
  )
}

function InlineNumberCell({ value, editing, editVal, onStart, onChange, onCommit, onCancel }: {
  value: number|null; editing: boolean; editVal: string;
  onStart:()=>void; onChange:(v:string)=>void; onCommit:()=>void; onCancel:()=>void
}) {
  if (!editing) return (
    <span className="fin-editable-cell" onClick={onStart} title="Clique para editar">
      {fmtBRL(value)}
    </span>
  )
  return (
    <input
      className="fin-inline-input fin-inline-input--number"
      autoFocus
      type="number"
      step="0.01"
      value={editVal}
      onChange={e=>onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e=>{ if(e.key==='Enter') onCommit(); if(e.key==='Escape') onCancel() }}
    />
  )
}
