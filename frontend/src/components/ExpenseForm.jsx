import { useState } from 'react'
import { useEscape } from '../lib/useEscape.js'

export default function ExpenseForm({ initial, categories, defaultDate, onSave, onClose }) {
  const [form, setForm] = useState({
    amount: initial ? String(initial.amount) : '',
    category: initial?.category ?? categories[0] ?? 'Food',
    date: initial?.date ?? defaultDate,
    description: initial?.description ?? '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEscape(onClose)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!(amount > 0)) return setError('Amount must be greater than 0')
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim())) return setError('Amount can have at most 2 decimal places')
    setBusy(true)
    try {
      await onSave({ ...form, amount: form.amount.trim(), description: form.description.trim() })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="card modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Expense form">
        <div>
          <h2>{initial ? 'Edit expense' : 'Add expense'}</h2>
          <p className="muted small" style={{ margin: '0.25rem 0 0' }}>
            {initial ? 'Update the details below.' : 'Log a new expense to your account.'}
          </p>
        </div>
        <label>
          Amount (₹)
          <input inputMode="decimal" required autoFocus value={form.amount} onChange={set('amount')} placeholder="0.00" />
        </label>
        <label>
          Category
          <select value={form.category} onChange={set('category')}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Date
          <input type="date" required value={form.date} onChange={set('date')} />
        </label>
        <label>
          Description
          <input maxLength={255} value={form.description} onChange={set('description')} placeholder="Optional" />
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
