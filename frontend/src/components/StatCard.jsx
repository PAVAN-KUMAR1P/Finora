import { ArrowDownIcon, ArrowUpIcon } from './icons.jsx'

/**
 * delta: { pct: number | null, label: string, goodWhen?: 'down' | 'up' }
 * The arrow and signed number carry the meaning; color is only reinforcement.
 */
function Delta({ pct, label, goodWhen = 'down' }) {
  if (pct == null) return <span className="delta flat">{label}</span>
  if (Math.abs(pct) < 0.05) return <span className="delta flat">No change {label}</span>
  const up = pct > 0
  const good = (goodWhen === 'down') === !up
  return (
    <span className={`delta ${good ? 'good' : 'bad'}`}>
      {up ? <ArrowUpIcon /> : <ArrowDownIcon />}
      {Math.abs(pct).toFixed(1)}% {label}
    </span>
  )
}

export default function StatCard({ icon: Icon, label, value, foot, delta }) {
  return (
    <div className="card stat-card">
      <div className="stat-head">
        <span className="muted small">{label}</span>
        {Icon && (
          <span className="stat-icon" aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
      </div>
      <div className="stat-value tabular">{value}</div>
      {delta && <Delta {...delta} />}
      {foot && <div className="stat-foot muted">{foot}</div>}
    </div>
  )
}
