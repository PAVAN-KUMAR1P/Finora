import { useState } from 'react'
import { useEscape } from '../lib/useEscape.js'
import { todayISO } from '../lib/format.js'

const MONEY_RE = /^\d+(\.\d{1,2})?$/

export default function InvestmentForm({ initial, types, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? types[0] ?? 'Stocks',
    amount_invested: initial ? String(initial.amount_invested) : '',
    current_value: initial ? String(initial.current_value) : '',
    purchase_date: initial?.purchase_date ?? todayISO(),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEscape(onClose)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const invested = form.amount_invested.trim()
    const current = form.current_value.trim()
    if (!(Number(invested) > 0)) return setError('Amount invested must be greater than 0')
    if (!MONEY_RE.test(invested) || !MONEY_RE.test(current)) return setError('Amounts must be numbers with at most 2 decimal places')
    setBusy(true)
    try {
      await onSave({ ...form, name: form.name.trim(), amount_invested: invested, current_value: current })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="card modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Investment form">
        <div>
          <h2>{initial ? 'Edit investment' : 'Add investment'}</h2>
          <p className="muted small" style={{ margin: '0.25rem 0 0' }}>
            Update the current value whenever you want to refresh your gain or loss.
          </p>
        </div>
        <label>
          Name
          <input required autoFocus maxLength={100} value={form.name} onChange={set('name')} placeholder="e.g. Nifty 50 Index Fund" />
        </label>
        <div className="form-grid">
          <label>
            Type
            <select value={form.type} onChange={set('type')}>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Purchase date
            <input type="date" required value={form.purchase_date} onChange={set('purchase_date')} />
          </label>
          <label>
            Amount invested (₹)
            <input inputMode="decimal" required value={form.amount_invested} onChange={set('amount_invested')} placeholder="0.00" />
          </label>
          <label>
            Current value (₹)
            <input inputMode="decimal" required value={form.current_value} onChange={set('current_value')} placeholder="0.00" />
          </label>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
