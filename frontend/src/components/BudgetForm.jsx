import { useState } from 'react'
import { useEscape } from '../lib/useEscape.js'

export default function BudgetForm({ initial, categories, defaultMonth, onSave, onClose }) {
  const [form, setForm] = useState({
    category: initial?.category ?? categories[0] ?? 'Food',
    month: initial?.month ?? defaultMonth,
    limit_amount: initial ? String(initial.limit_amount) : '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEscape(onClose)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const limit = form.limit_amount.trim()
    if (!(Number(limit) > 0)) return setError('Limit must be greater than 0')
    if (!/^\d+(\.\d{1,2})?$/.test(limit)) return setError('Limit can have at most 2 decimal places')
    setBusy(true)
    try {
      await onSave({ ...form, limit_amount: limit })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="card modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Budget form">
        <div>
          <h2>{initial ? 'Edit budget' : 'Set a budget'}</h2>
          <p className="muted small" style={{ margin: '0.25rem 0 0' }}>
            Monthly spending limit for one category.
          </p>
        </div>
        <label>
          Category
          <select value={form.category} onChange={set('category')}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Month
          <input type="month" required value={form.month} onChange={set('month')} />
        </label>
        <label>
          Monthly limit (₹)
          <input inputMode="decimal" required autoFocus value={form.limit_amount} onChange={set('limit_amount')} placeholder="0.00" />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
