const TOKEN_KEY = 'ft_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

function errorMessage(body, status) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{loc, msg}, ...]
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join('; ')
  return `Request failed (${status})`
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) onUnauthorized()
  if (!res.ok) throw new Error(errorMessage(data, res.status))
  return data
}
