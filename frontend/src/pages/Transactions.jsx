import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { assignCategoryColors } from '../lib/categoryColors.js'
import { money, monthLabel, thisMonth, todayISO } from '../lib/format.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import { SkeletonLines } from '../components/Skeleton.jsx'
import { PlusIcon, SearchIcon } from '../components/icons.jsx'

export default function Transactions() {
  const [month, setMonth] = useState(thisMonth())
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | expense
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setExpenses(await api(`/expenses?month=${month}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])
  useEffect(() => { api('/categories').then(setCategories).catch(() => {}) }, [])

  const colors = useMemo(() => {
    const totals = new Map()
    for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount))
    return assignCategoryColors([...totals.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c))
  }, [expenses])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return expenses.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || `${e.description} ${e.category} ${e.amount} ${e.date}`.toLowerCase().includes(q)),
    )
  }, [expenses, category, query])

  const filtered = Boolean(category || query.trim())
  const visibleTotal = visible.reduce((s, e) => s + Number(e.amount), 0)

  const save = async (data) => {
    if (editing === 'new') await api('/expenses', { method: 'POST', body: data })
    else await api(`/expenses/${editing.id}`, { method: 'PUT', body: data })
    setEditing(null)
    await load()
  }

  const remove = async (exp) => {
    if (!window.confirm(`Delete "${exp.description || exp.category}" (${money(exp.amount)})?`)) return
    try {
      await api(`/expenses/${exp.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted">Every expense for {monthLabel(month)}</p>
        </div>
        <div className="row">
          <input
            type="month" className="month-input" aria-label="Select month" value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
          <button className="btn primary" onClick={() => setEditing('new')}><PlusIcon size={16} /> Add expense</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="card">
        <div className="filters" role="search">
          <div className="search-field">
            <SearchIcon size={16} />
            <input
              type="search" aria-label="Search transactions" placeholder="Search description, category, amount…"
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          {filtered && (
            <button className="btn ghost sm" onClick={() => { setQuery(''); setCategory('') }}>Clear filters</button>
          )}
        </div>

        <div className="section-head">
          <h2>
            Expenses{' '}
            {!loading && (
              <span className="muted small" style={{ fontWeight: 500 }}>
                {filtered ? `${visible.length} of ${expenses.length}` : visible.length} · {money(visibleTotal)}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <SkeletonLines count={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            title={filtered ? 'No expenses match your filters' : `No expenses in ${monthLabel(month)}`}
            body={filtered ? 'Try a different search or clear the filters.' : 'Add your first expense to get started.'}
            action={
              filtered
                ? <button className="btn ghost sm" onClick={() => { setQuery(''); setCategory('') }}>Clear filters</button>
                : <button className="btn primary sm" onClick={() => setEditing('new')}><PlusIcon size={14} /> Add expense</button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Category</th><th>Description</th><th className="num">Amount</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td className="tabular">{e.date}</td>
                    <td>
                      <button className="tag tag-button" onClick={() => setCategory(e.category)} title={`Filter by ${e.category}`}>
                        <span className="tag-dot" style={{ background: colors.get(e.category)?.color ?? 'var(--ink-400)' }} />
                        {e.category}
                      </button>
                    </td>
                    <td>{e.description || <span className="muted">—</span>}</td>
                    <td className="num">{money(e.amount)}</td>
                    <td className="actions">
                      <button className="btn ghost sm" onClick={() => setEditing(e)} aria-label={`Edit ${e.description || e.category}`}>Edit</button>
                      <button className="btn ghost sm danger" onClick={() => remove(e)} aria-label={`Delete ${e.description || e.category}`}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ExpenseForm
          initial={editing === 'new' ? null : editing}
          categories={categories}
          defaultDate={month === thisMonth() ? todayISO() : `${month}-01`}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
