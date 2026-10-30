import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { assignCategoryColors, textOnFill } from '../lib/categoryColors.js'
import { daysInMonth, elapsedDays, money, monthLabel, pctChange, prevMonth, thisMonth, todayISO } from '../lib/format.js'
import CategoryDonut from '../components/CategoryDonut.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import StatCard from '../components/StatCard.jsx'
import TrendCard from '../components/TrendCard.jsx'
import { SkeletonCards, SkeletonLines } from '../components/Skeleton.jsx'
import { CalendarIcon, GaugeIcon, InboxIcon, PieIcon, PlusIcon, WalletIcon } from '../components/icons.jsx'

export default function Dashboard() {
  const [month, setMonth] = useState(thisMonth())
  const [summary, setSummary] = useState(null)
  const [prevSummary, setPrevSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [s, p, e, b] = await Promise.all([
        api(`/summary?month=${month}`),
        api(`/summary?month=${prevMonth(month)}`),
        api(`/expenses?month=${month}`),
        api(`/budgets/status?month=${month}`),
      ])
      setSummary(s)
      setPrevSummary(p)
      setExpenses(e)
      setBudgets(b)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])
  useEffect(() => { api('/categories').then(setCategories).catch(() => {}) }, [])

  const m = useMemo(() => {
    if (!summary) return null
    const total = Number(summary.total)
    const prevTotal = Number(prevSummary?.total ?? 0)
    const days = elapsedDays(month)
    const avg = days > 0 ? total / days : 0
    const prevAvg = prevTotal / daysInMonth(prevMonth(month))

    const limit = budgets.reduce((s, b) => s + Number(b.limit_amount), 0)
    const spentOnBudgets = budgets.reduce((s, b) => s + Number(b.spent), 0)
    return {
      total, days, avg,
      totalDelta: pctChange(total, prevTotal),
      avgDelta: days > 0 ? pctChange(avg, prevAvg) : null,
      hasPrev: prevTotal > 0,
      hasBudgets: budgets.length > 0,
      limit,
      remaining: limit - spentOnBudgets,
      utilization: limit ? (spentOnBudgets / limit) * 100 : 0,
      overCount: budgets.filter((b) => b.state === 'over').length,
      top: summary.by_category[0],
      colors: assignCategoryColors(summary.by_category.map((c) => c.category)),
    }
  }, [summary, prevSummary, budgets, month])

  const hasData = (summary?.count ?? 0) > 0
  const recent = expenses.slice(0, 6)
  const noCompare = { pct: null, label: 'No data last month to compare' }

  const save = async (data) => {
    await api('/expenses', { method: 'POST', body: data })
    setAdding(false)
    await load()
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted">Your spending for {monthLabel(month)}</p>
        </div>
        <div className="row">
          <input
            type="month" className="month-input" aria-label="Select month" value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
          <button className="btn primary" onClick={() => setAdding(true)}><PlusIcon size={16} /> Add expense</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading && !m ? (
        <SkeletonCards count={4} />
      ) : m && (
        <div className="stat-grid">
          <StatCard
            icon={WalletIcon} label="Total expenses" value={money(m.total)}
            delta={m.hasPrev ? { pct: m.totalDelta, label: 'vs last month' } : noCompare}
            foot={`${summary.count} transaction${summary.count === 1 ? '' : 's'}`}
          />
          {m.hasBudgets ? (
            <StatCard
              icon={PieIcon} label="Remaining budget"
              value={m.remaining >= 0 ? money(m.remaining) : `${money(-m.remaining)} over`}
              foot={`of ${money(m.limit)} budgeted across ${budgets.length} categor${budgets.length === 1 ? 'y' : 'ies'}`}
            />
          ) : (
            <StatCard icon={PieIcon} label="Remaining budget" value="—" foot={<Link to="/budgets">Set a budget to track this →</Link>} />
          )}
          <StatCard
            icon={CalendarIcon} label="Average daily spend" value={m.days > 0 ? money(m.avg) : '—'}
            delta={m.days > 0 && m.hasPrev ? { pct: m.avgDelta, label: 'vs last month' } : m.days > 0 ? noCompare : undefined}
            foot={m.days > 0 ? `Over ${m.days} day${m.days === 1 ? '' : 's'}` : 'This month hasn’t started'}
          />
          {m.hasBudgets ? (
            <StatCard
              icon={GaugeIcon} label="Budget utilization" value={`${m.utilization.toFixed(0)}%`}
              foot={m.overCount ? `${m.overCount} of ${budgets.length} budgets over limit` : 'All budgets within limit'}
            />
          ) : (
            <StatCard icon={GaugeIcon} label="Budget utilization" value="—" foot="Appears once you set a budget" />
          )}
        </div>
      )}

      {!loading && m && !hasData ? (
        <div className="card setup-card">
          <span className="empty-icon" style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'grid', placeItems: 'center', color: 'var(--ink-400)' }}>
            <InboxIcon />
          </span>
          <div className="grow">
            <h3>No expenses in {monthLabel(month)}</h3>
            <p className="muted">Add your first expense to see trends, a category breakdown and budget progress here.</p>
          </div>
          <button className="btn primary" onClick={() => setAdding(true)}><PlusIcon size={16} /> Add expense</button>
        </div>
      ) : m ? (
        <>
          <div className="analytics-grid">
            {loading ? (
              <>
                <div className="card"><SkeletonLines count={5} /></div>
                <div className="card"><SkeletonLines count={5} /></div>
              </>
            ) : (
              <>
                <TrendCard expenses={expenses} month={month} />
                <div className="card">
                  <div className="section-head">
                    <div>
                      <h2>Spending by category</h2>
                      <p className="muted small">Share of {monthLabel(month)} total</p>
                    </div>
                  </div>
                  <CategoryDonut byCategory={summary.by_category} total={summary.total} />
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="section-head">
              <h2>Recent transactions</h2>
              <div className="row">
                <Link to="/transactions" className="small">View all →</Link>
                <button className="btn primary sm" onClick={() => setAdding(true)}><PlusIcon size={14} /> Add expense</button>
              </div>
            </div>
            {loading ? (
              <SkeletonLines count={4} />
            ) : (
              <div className="tx-list">
                {recent.map((e) => {
                  const c = m.colors.get(e.category)
                  return (
                    <div key={e.id} className="tx-row">
                      <span className="tx-icon" aria-hidden="true" style={{ background: c?.color ?? 'var(--ink-400)', color: c ? textOnFill(c.color) : '#fff' }}>
                        {e.category.slice(0, 1)}
                      </span>
                      <div className="tx-main">
                        <div className="tx-desc">{e.description || e.category}</div>
                        <div className="tx-meta tx-meta-inline">{e.category} · {e.date}</div>
                      </div>
                      <span className="tx-cat">
                        <span className="tag"><span className="tag-dot" style={{ background: c?.color }} />{e.category}</span>
                      </span>
                      <span className="tx-date tabular">{e.date}</span>
                      <div className="tx-amount tabular">− {money(e.amount)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : null}

      {adding && (
        <ExpenseForm
          categories={categories}
          defaultDate={month === thisMonth() ? todayISO() : `${month}-01`}
          onSave={save}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
