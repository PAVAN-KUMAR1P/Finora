import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { money, monthLabel, thisMonth } from '../lib/format.js'
import BudgetForm from '../components/BudgetForm.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import StatCard from '../components/StatCard.jsx'
import { SkeletonCards, SkeletonLines } from '../components/Skeleton.jsx'
import { PieIcon, PlusIcon, WalletIcon } from '../components/icons.jsx'

const STATE_LABEL = { ok: 'On track', warning: 'Near limit', over: 'Over budget' }

export default function Budgets() {
  const [month, setMonth] = useState(thisMonth())
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | budget
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setBudgets(await api(`/budgets/status?month=${month}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])
  useEffect(() => { api('/categories').then(setCategories).catch(() => {}) }, [])

  const save = async (data) => {
    if (editing === 'new') await api('/budgets', { method: 'POST', body: data })
    else await api(`/budgets/${editing.id}`, { method: 'PUT', body: data })
    setEditing(null)
    // Follow the budget's month so the user sees what they just saved
    if (data.month !== month) setMonth(data.month)
    else await load()
  }

  const remove = async (b) => {
    if (!window.confirm(`Delete the ${b.category} budget for ${monthLabel(b.month)}?`)) return
    try {
      await api(`/budgets/${b.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit_amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0)
  const overCount = budgets.filter((b) => b.state === 'over').length

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted small">Spending limits for {monthLabel(month)}</p>
        </div>
        <div className="row">
          <input type="month" className="month-input" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="btn primary" onClick={() => setEditing('new')}><PlusIcon size={16} /> Set budget</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <SkeletonCards count={3} />
      ) : budgets.length > 0 && (
        <div className="stat-grid">
          <StatCard icon={PieIcon} label="Total budgeted" value={money(totalLimit)} foot={`${budgets.length} categor${budgets.length === 1 ? 'y' : 'ies'}`} />
          <StatCard icon={WalletIcon} label="Spent against budgets" value={money(totalSpent)} foot={totalLimit ? `${Math.round((totalSpent / totalLimit) * 100)}% of total budget` : ''} />
          <StatCard icon={PieIcon} label="Over budget" value={overCount} foot={overCount ? 'Categories above their limit' : 'All within limits'} />
        </div>
      )}

      {loading ? (
        <div className="card"><SkeletonLines count={4} /></div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No budgets for this month"
            body="Set a spending limit for a category and track how much of it you've used."
            action={<button className="btn primary sm" onClick={() => setEditing('new')}><PlusIcon size={14} /> Set budget</button>}
          />
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => (
            <div key={b.id} className="card budget-card">
              <div className="section-head" style={{ marginBottom: '0.75rem' }}>
                <h2>{b.category}</h2>
                <span className={`status-pill ${b.state}`}>{STATE_LABEL[b.state]}</span>
              </div>
              <div className="budget-amounts tabular">
                <strong>{money(b.spent)}</strong>
                <span className="muted small"> of {money(b.limit_amount)}</span>
              </div>
              <div className="progress" role="progressbar" aria-valuenow={Math.min(b.percent_used, 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className={`progress-bar ${b.state}`} style={{ width: `${Math.min(b.percent_used, 100)}%` }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="small muted tabular">
                  {Number(b.remaining) >= 0 ? `${money(b.remaining)} left` : `${money(-b.remaining)} over`} · {b.percent_used}%
                </span>
                <span>
                  <button className="btn ghost sm" onClick={() => setEditing(b)}>Edit</button>{' '}
                  <button className="btn ghost sm danger" onClick={() => remove(b)}>Delete</button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BudgetForm
          initial={editing === 'new' ? null : editing}
          categories={categories}
          defaultMonth={month}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
