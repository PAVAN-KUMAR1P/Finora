import { InboxIcon } from './icons.jsx'

export default function EmptyState({ title, body, action, compact = false }) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <div className="empty-icon"><InboxIcon /></div>
      <h3>{title}</h3>
      {body && <p className="muted">{body}</p>}
      {action}
    </div>
  )
}
