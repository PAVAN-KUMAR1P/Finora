import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { assignCategoryColors } from '../lib/categoryColors.js'
import { money, moneyCompact, monthLabel, shortMonth } from '../lib/format.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import StatCard from '../components/StatCard.jsx'
import { SkeletonCards, SkeletonLines } from '../components/Skeleton.jsx'
import { BarChartIcon, PieIcon, TrendIcon, WalletIcon } from '../components/icons.jsx'

const RANGES = [3, 6, 12]
const signed = (n) => `${Number(n) >= 0 ? '+' : '−'}${money(Math.abs(Number(n)))}`

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', boxShadow: 'var(--shadow-md)' }}>
      <div className="small muted">{monthLabel(d.month)}</div>
      <div className="small" style={{ fontWeight: 700 }}>{moneyCompact(d.total)}</div>
      <div className="small muted">{d.count} transaction{d.count === 1 ? '' : 's'}</div>
    </div>
  )
}

export default function Reports() {
  const [months, setMonths] = useState(6)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setData(await api(`/reports/overview?months=${months}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => { load() }, [load])

  const view = useMemo(() => {
    if (!data) return null
    const monthly = data.monthly.map((m) => ({ ...m, total: Number(m.total) }))
    const total = Number(data.total_spent)
    const peak = monthly.reduce((a, b) => (b.total > a.total ? b : a), monthly[0])
    const colors = assignCategoryColors(data.by_category.map((c) => c.category))
    return { monthly, total, peak, colors }
  }, [data])

  const hasSpend = view && view.total > 0

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted small">
            {data ? `${monthLabel(data.start_month)} – ${monthLabel(data.end_month)}` : 'Spending, budgets and holdings at a glance'}
          </p>
        </div>
        <div className="row no-print">
          <div className="segmented" role="group" aria-label="Report range">
            {RANGES.map((r) => (
              <button key={r} className={months === r ? 'active' : ''} onClick={() => setMonths(r)}>{r}M</button>
            ))}
          </div>
          <button className="btn ghost" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading || !data ? (
        <>
          <SkeletonCards count={4} />
          <div className="card"><SkeletonLines count={5} /></div>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard icon={WalletIcon} label="Total spent" value={money(data.total_spent)} foot={`Last ${data.months} months`} />
            <StatCard icon={BarChartIcon} label="Monthly average" value={money(view.total / data.months)} foot="Across the selected range" />
            <StatCard
              icon={TrendIcon}
              label="Highest month"
              value={hasSpend ? money(view.peak.total) : '—'}
              foot={hasSpend ? monthLabel(view.peak.month) : 'No spending yet'}
            />
            <StatCard
              icon={PieIcon}
              label="Budgets kept"
              value={data.budgets.total ? `${data.budgets.kept} of ${data.budgets.total}` : '—'}
              foot={data.budgets.total ? `${data.budgets.exceeded} exceeded` : <Link to="/budgets">Set a budget</Link>}
            />
          </div>

          <div className="analytics-grid">
            <div className="card">
              <div className="section-head">
                <div>
                  <h2>Monthly spending</h2>
                  <p className="muted small">Total spent per month</p>
                </div>
              </div>
              {hasSpend ? (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={view.monthly} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--grid-line)" />
                      <XAxis dataKey="month" tickFormatter={shortMonth} stroke="var(--axis-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="var(--axis-muted)" fontSize={11} tickLine={false} axisLine={false} width={46}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip content={<Tip />} cursor={{ fill: 'var(--surface-sunken)' }} />
                      <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No spending in this period" body="Add expenses and your monthly totals will appear here." />
              )}
            </div>

            <div className="card">
              <div className="section-head">
                <h2>Top categories</h2>
              </div>
              {data.by_category.length === 0 ? (
                <EmptyState title="No categories yet" body="Your biggest spending categories will be ranked here." />
              ) : (
                <div className="rank-list">
                  {data.by_category.slice(0, 8).map((c) => {
                    const share = view.total ? (Number(c.total) / view.total) * 100 : 0
                    const color = view.colors.get(c.category).color
                    return (
                      <div key={c.category} className="rank-row">
                        <div className="legend-row">
                          <span className="label">
                            <span className="legend-swatch" style={{ background: color }} />
                            <span className="name">{c.category}</span>
                          </span>
                          <span className="amount tabular">{money(c.total)} <span className="muted small">· {share.toFixed(0)}%</span></span>
                        </div>
                        <div className="progress"><div className="progress-bar" style={{ width: `${share}%`, background: color }} /></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="section-head">
                <h2>Investments</h2>
                <Link to="/investments" className="small no-print">Manage →</Link>
              </div>
              {data.investments.count === 0 ? (
                <p className="muted small">No investments recorded.</p>
              ) : (
                <dl className="kv">
                  <dt>Invested</dt><dd className="tabular">{money(data.investments.invested)}</dd>
                  <dt>Current value</dt><dd className="tabular">{money(data.investments.current_value)}</dd>
                  <dt>Gain / loss</dt>
                  <dd className={`tabular ${Number(data.investments.gain) >= 0 ? 'gain' : 'loss'}`}>{signed(data.investments.gain)}</dd>
                </dl>
              )}
            </div>
            <div className="card">
              <div className="section-head">
                <h2>Fixed deposits</h2>
                <Link to="/fixed-deposits" className="small no-print">Manage →</Link>
              </div>
              {data.fixed_deposits.count === 0 ? (
                <p className="muted small">No fixed deposits recorded.</p>
              ) : (
                <dl className="kv">
                  <dt>Deposited</dt><dd className="tabular">{money(data.fixed_deposits.principal)}</dd>
                  <dt>Value at maturity</dt><dd className="tabular">{money(data.fixed_deposits.maturity_amount)}</dd>
                  <dt>Deposits</dt><dd className="tabular">{data.fixed_deposits.count} ({data.fixed_deposits.active} active)</dd>
                </dl>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h2>Month-by-month</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Month</th><th className="num">Transactions</th><th className="num">Total spent</th></tr>
                </thead>
                <tbody>
                  {[...view.monthly].reverse().map((m) => (
                    <tr key={m.month}>
                      <td>{monthLabel(m.month)}</td>
                      <td className="num">{m.count}</td>
                      <td className="num">{money(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
