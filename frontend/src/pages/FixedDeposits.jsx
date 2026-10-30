import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { money } from '../lib/format.js'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import FDForm from '../components/FDForm.jsx'
import StatCard from '../components/StatCard.jsx'
import { SkeletonCards, SkeletonLines } from '../components/Skeleton.jsx'
import { LandmarkIcon, PlusIcon, TrendIcon, WalletIcon } from '../components/icons.jsx'

export default function FixedDeposits() {
  const [fds, setFds] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | fd
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setFds(await api('/fixed-deposits'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (data) => {
    if (editing === 'new') await api('/fixed-deposits', { method: 'POST', body: data })
    else await api(`/fixed-deposits/${editing.id}`, { method: 'PUT', body: data })
    setEditing(null)
    await load()
  }

  const remove = async (fd) => {
    if (!window.confirm(`Delete the ${fd.bank_name} fixed deposit of ${money(fd.principal)}?`)) return
    try {
      await api(`/fixed-deposits/${fd.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const sum = (key) => fds.reduce((s, f) => s + Number(f[key]), 0)
  const active = fds.filter((f) => f.status === 'active').length

  return (
    <div className="page">
      <div className="toolbar">
        <div className="title-block">
          <p className="muted small">Track deposits and their maturity value</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}><PlusIcon size={16} /> Add fixed deposit</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <SkeletonCards count={4} />
      ) : fds.length > 0 && (
        <div className="stat-grid">
          <StatCard icon={WalletIcon} label="Total invested" value={money(sum('principal'))} foot={`${fds.length} deposit${fds.length === 1 ? '' : 's'}`} />
          <StatCard icon={TrendIcon} label="Value at maturity" value={money(sum('maturity_amount'))} foot="Across all deposits" />
          <StatCard icon={TrendIcon} label="Interest earned at maturity" value={money(sum('interest_earned'))} foot="Maturity value minus principal" />
          <StatCard icon={LandmarkIcon} label="Active deposits" value={active} foot={`${fds.length - active} matured`} />
        </div>
      )}

      <div className="card">
        <div className="section-head">
          <h2>Your fixed deposits</h2>
        </div>
        {loading ? (
          <SkeletonLines count={4} />
        ) : fds.length === 0 ? (
          <EmptyState
            title="No fixed deposits yet"
            body="Add a deposit to see its maturity value, interest earned and time remaining."
            action={<button className="btn primary sm" onClick={() => setEditing('new')}><PlusIcon size={14} /> Add fixed deposit</button>}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bank</th><th className="num">Principal</th><th className="num">Rate</th><th>Tenure</th>
                  <th>Matures on</th><th className="num">Maturity value</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {fds.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.bank_name}</strong></td>
                    <td className="num">{money(f.principal)}</td>
                    <td className="num">{Number(f.interest_rate)}%</td>
                    <td>{f.tenure_months} mo</td>
                    <td>{f.maturity_date}</td>
                    <td className="num">{money(f.maturity_amount)}</td>
                    <td>
                      <span className={`status-pill ${f.status === 'active' ? 'ok' : 'matured'}`}>
                        {f.status === 'active' ? `Active · ${f.days_remaining}d left` : 'Matured'}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="btn ghost sm" onClick={() => setEditing(f)}>Edit</button>
                      <button className="btn ghost sm danger" onClick={() => remove(f)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <FDForm initial={editing === 'new' ? null : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
