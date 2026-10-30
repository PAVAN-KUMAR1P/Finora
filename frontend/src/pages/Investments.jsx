import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { money } from '../lib/format.js'
import CategoryDonut from '../components/CategoryDonut.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import InvestmentForm from '../components/InvestmentForm.jsx'
import StatCard from '../components/StatCard.jsx'
import { SkeletonCards, SkeletonLines } from '../components/Skeleton.jsx'
import { PieIcon, PlusIcon, TrendIcon, WalletIcon } from '../components/icons.jsx'

// Sign is always printed, so gain vs loss never depends on color alone.
const signed = (n) => `${Number(n) >= 0 ? '+' : '−'}${money(Math.abs(Number(n)))}`
const signedPct = (n) => `${Number(n) >= 0 ? '+' : '−'}${Math.abs(Number(n)).toFixed(2)}%`
const tone = (n) => (Number(n) >= 0 ? 'gain' : 'loss')

export default function Investments() {
  const [items, setItems] = useState([])
  const [types, setTypes] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | investment
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setItems(await api('/investments'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { api('/investments/types').then(setTypes).catch(() => {}) }, [])

  const save = async (data) => {
    if (editing === 'new') await api('/investments', { method: 'POST', body: data })
    else await api(`/investments/${editing.id}`, { method: 'PUT', body: data })
    setEditing(null)
    await load()
  }

  const remove = async (inv) => {
    if (!window.confirm(`Delete "${inv.name}" (${money(inv.amount_invested)} invested)?`)) return
    try {
      await api(`/investments/${inv.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const totals = useMemo(() => {
    const invested = items.reduce((s, i) => s + Number(i.amount_invested), 0)
    const current = items.reduce((s, i) => s + Number(i.current_value), 0)
    const gain = current - invested
    return { invested, current, gain, pct: invested ? (gain / invested) * 100 : 0 }
  }, [items])

  // Allocation by type, weighted by current value, largest first
  const allocation = useMemo(() => {
    const byType = new Map()
    for (const i of items) byType.set(i.type, (byType.get(i.type) ?? 0) + Number(i.current_value))
    return [...byType.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total }))
  }, [items])

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted small">Your holdings, valued at the amounts you enter</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}><PlusIcon size={16} /> Add investment</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <SkeletonCards count={4} />
      ) : items.length > 0 && (
        <div className="stat-grid">
          <StatCard icon={WalletIcon} label="Total invested" value={money(totals.invested)} foot={`${items.length} holding${items.length === 1 ? '' : 's'}`} />
          <StatCard icon={PieIcon} label="Current value" value={money(totals.current)} foot="As last updated by you" />
          <StatCard
            icon={TrendIcon}
            label="Total gain / loss"
            value={<span className={tone(totals.gain)}>{signed(totals.gain)}</span>}
            foot={<span className={tone(totals.gain)}>{signedPct(totals.pct)} overall</span>}
          />
          <StatCard icon={PieIcon} label="Asset types" value={new Set(items.map((i) => i.type)).size} foot="Distinct categories held" />
        </div>
      )}

      {!loading && allocation.length > 0 && (
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Allocation</h2>
              <p className="muted small">Share of current value by asset type</p>
            </div>
          </div>
          <CategoryDonut byCategory={allocation} total={totals.current} />
        </div>
      )}

      <div className="card">
        <div className="section-head">
          <h2>Holdings</h2>
        </div>
        {loading ? (
          <SkeletonLines count={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No investments yet"
            body="Add a holding to track what you invested, what it's worth now and your gain or loss."
            action={<button className="btn primary sm" onClick={() => setEditing('new')}><PlusIcon size={14} /> Add investment</button>}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Purchased</th><th className="num">Invested</th>
                  <th className="num">Current value</th><th className="num">Gain / loss</th><th />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.name}</strong></td>
                    <td><span className="tag">{i.type}</span></td>
                    <td>{i.purchase_date}</td>
                    <td className="num">{money(i.amount_invested)}</td>
                    <td className="num">{money(i.current_value)}</td>
                    <td className={`num ${tone(i.gain)}`}>
                      {signed(i.gain)}
                      <div className="small">{signedPct(i.gain_percent)}</div>
                    </td>
                    <td className="actions">
                      <button className="btn ghost sm" onClick={() => setEditing(i)}>Edit</button>
                      <button className="btn ghost sm danger" onClick={() => remove(i)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <InvestmentForm initial={editing === 'new' ? null : editing} types={types} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
