import { useState } from 'react'
import { useEscape } from '../lib/useEscape.js'
import { money, todayISO } from '../lib/format.js'

const COMPOUNDING = [
  { value: 1, label: 'Yearly' },
  { value: 2, label: 'Half-yearly' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
]

// Same formula the server uses: A = P * (1 + r/n) ** (n * t)
const maturityPreview = (p, ratePct, months, n) => p * (1 + ratePct / 100 / n) ** ((n * months) / 12)

export default function FDForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    bank_name: initial?.bank_name ?? '',
    principal: initial ? String(initial.principal) : '',
    interest_rate: initial ? String(initial.interest_rate) : '',
    start_date: initial?.start_date ?? todayISO(),
    tenure_months: initial ? String(initial.tenure_months) : '12',
    compounding_per_year: initial?.compounding_per_year ?? 4,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEscape(onClose)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const p = Number(form.principal)
  const r = Number(form.interest_rate)
  const m = Number(form.tenure_months)
  const n = Number(form.compounding_per_year)
  const valid = p > 0 && r > 0 && m >= 1
  const preview = valid ? maturityPreview(p, r, m, n) : null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!(p > 0)) return setError('Principal must be greater than 0')
    if (!/^\d+(\.\d{1,2})?$/.test(form.principal.trim())) return setError('Principal can have at most 2 decimal places')
    if (!(r > 0 && r <= 30)) return setError('Interest rate must be between 0 and 30%')
    if (!/^\d+(\.\d{1,2})?$/.test(form.interest_rate.trim())) return setError('Interest rate can have at most 2 decimal places')
    if (!Number.isInteger(m) || m < 1 || m > 120) return setError('Tenure must be a whole number of months (1–120)')
    setBusy(true)
    try {
      await onSave({
        bank_name: form.bank_name.trim(),
        principal: form.principal.trim(),
        interest_rate: form.interest_rate.trim(),
        start_date: form.start_date,
        tenure_months: m,
        compounding_per_year: n,
      })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="card modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Fixed deposit form">
        <div>
          <h2>{initial ? 'Edit fixed deposit' : 'Add fixed deposit'}</h2>
          <p className="muted small" style={{ margin: '0.25rem 0 0' }}>Maturity value is calculated for you.</p>
        </div>
        <label>
          Bank / institution
          <input required autoFocus maxLength={100} value={form.bank_name} onChange={set('bank_name')} placeholder="e.g. SBI" />
        </label>
        <div className="form-grid">
          <label>
            Principal (₹)
            <input inputMode="decimal" required value={form.principal} onChange={set('principal')} placeholder="0.00" />
          </label>
          <label>
            Interest rate (% p.a.)
            <input inputMode="decimal" required value={form.interest_rate} onChange={set('interest_rate')} placeholder="7.00" />
          </label>
          <label>
            Start date
            <input type="date" required value={form.start_date} onChange={set('start_date')} />
          </label>
          <label>
            Tenure (months)
            <input inputMode="numeric" required value={form.tenure_months} onChange={set('tenure_months')} />
          </label>
        </div>
        <label>
          Compounding
          <select value={form.compounding_per_year} onChange={set('compounding_per_year')}>
            {COMPOUNDING.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <div className="preview-box">
          {preview ? (
            <>
              <span className="muted small">Estimated maturity value</span>
              <strong className="tabular">{money(preview)}</strong>
              <span className="small muted tabular">Interest earned {money(preview - p)}</span>
            </>
          ) : (
            <span className="muted small">Enter principal, rate and tenure to preview the maturity value.</span>
          )}
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
