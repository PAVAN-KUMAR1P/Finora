export const money = (n) =>
  Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

export const moneyCompact = (n) =>
  Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const pad = (n) => String(n).padStart(2, '0')

// Local-time dates. toISOString() is UTC and gives the wrong day/month for IST users around midnight.
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const thisMonth = () => todayISO().slice(0, 7)

export const prevMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const daysInMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
/** Days of `ym` that have happened so far (all of them for past months, 0 for future ones). */
export const elapsedDays = (ym) => {
  const now = thisMonth()
  if (ym < now) return daysInMonth(ym)
  if (ym > now) return 0
  return new Date().getDate()
}
/** Percent change from prev to curr, or null when there is no baseline. */
export const pctChange = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : null)

export const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const shortMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" })
}
