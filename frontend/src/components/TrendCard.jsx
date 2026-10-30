import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api.js'
import { daysInMonth, money, moneyCompact, monthLabel, shortMonth } from '../lib/format.js'
import EmptyState from './EmptyState.jsx'
import { SkeletonLines } from './Skeleton.jsx'

const MODES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]
const ACCENT = '#059669'

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', boxShadow: 'var(--shadow-md)' }}>
      <div className="small muted">{d.tooltip}</div>
      <div className="small" style={{ fontWeight: 700 }}>{money(d.amount)}</div>
    </div>
  )
}

/** Buckets for the selected month, built only from the user's real expenses. */
function buildDaily(expenses, month) {
  const byDay = new Map()
  for (const e of expenses) byDay.set(e.date, (byDay.get(e.date) ?? 0) + Number(e.amount))
  return Array.from({ length: daysInMonth(month) }, (_, i) => {
    const day = i + 1
    return {
      key: day,
      label: String(day),
      tooltip: `${day} ${shortMonth(month)} ${month.slice(0, 4)}`,
      amount: byDay.get(`${month}-${String(day).padStart(2, '0')}`) ?? 0,
    }
  })
}

function buildWeekly(expenses, month) {
  const last = daysInMonth(month)
  const weeks = Array.from({ length: Math.ceil(last / 7) }, (_, i) => {
    const from = i * 7 + 1
    const to = Math.min(from + 6, last)
    return { key: i, label: `${from}–${to}`, tooltip: `${shortMonth(month)} ${from}–${to}`, amount: 0 }
  })
  for (const e of expenses) weeks[Math.floor((Number(e.date.slice(8, 10)) - 1) / 7)].amount += Number(e.amount)
  return weeks
}

export default function TrendCard({ expenses, month }) {
  const [mode, setMode] = useState('daily')
  const [monthly, setMonthly] = useState(null) // last 6 months, fetched on demand
  const [state, setState] = useState({ loading: false, error: '' })

  useEffect(() => {
    if (mode !== 'monthly') return
    let live = true
    setState({ loading: true, error: '' })
    api('/reports/overview?months=6')
      .then((r) => live && (setMonthly(r.monthly), setState({ loading: false, error: '' })))
      .catch((e) => live && setState({ loading: false, error: e.message }))
    return () => { live = false }
  }, [mode, expenses])

  const data = useMemo(() => {
    if (mode === 'daily') return buildDaily(expenses, month)
    if (mode === 'weekly') return buildWeekly(expenses, month)
    return (monthly ?? []).map((m) => ({
      key: m.month, label: shortMonth(m.month), tooltip: monthLabel(m.month), amount: Number(m.total),
    }))
  }, [mode, expenses, month, monthly])

  const hasData = data.some((d) => d.amount > 0)
  const subtitle = mode === 'monthly' ? 'Last 6 months' : `${mode === 'daily' ? 'Daily' : 'Weekly'} totals for ${monthLabel(month)}`
  const yTick = (v) => (v >= 1000 ? `${v / 1000}k` : v)
  const common = { stroke: 'var(--axis-muted)', fontSize: 11, tickLine: false, axisLine: false }

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h2>Spending trend</h2>
          <p className="muted small">{subtitle}</p>
        </div>
        <div className="segmented" role="group" aria-label="Trend granularity">
          {MODES.map((m) => (
            <button key={m.id} className={mode === m.id ? 'active' : ''} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {state.loading ? (
        <SkeletonLines count={5} />
      ) : state.error ? (
        <div className="error" role="alert">Couldn’t load monthly data: {state.error}</div>
      ) : !hasData ? (
        <EmptyState compact title="No spending in this period" body="Switch the month or add an expense." />
      ) : (
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            {mode === 'daily' ? (
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--grid-line)" />
                <XAxis dataKey="label" interval={Math.ceil(data.length / 8) - 1} {...common} />
                <YAxis width={46} tickFormatter={yTick} {...common} />
                <Tooltip content={<Tip />} cursor={{ stroke: 'var(--border-strong)' }} />
                <Area
                  type="monotone" dataKey="amount" stroke={ACCENT} strokeWidth={2} fill="url(#trendFill)"
                  dot={false} activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--grid-line)" />
                <XAxis dataKey="label" {...common} />
                <YAxis width={46} tickFormatter={yTick} {...common} />
                <Tooltip content={<Tip />} cursor={{ fill: 'var(--surface-sunken)' }} />
                <Bar dataKey="amount" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
