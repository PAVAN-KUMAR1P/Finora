export function SkeletonCards({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton skeleton-card" />
      ))}
    </div>
  )
}

export function SkeletonLines({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${100 - i * 8}%` }} />
      ))}
    </div>
  )
}
