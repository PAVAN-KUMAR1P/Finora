import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) return
    api('/auth/me')
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  const login = async (email, password) => {
    const { access_token } = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(access_token)
    setUser(await api('/auth/me'))
  }

  const register = async (email, password) => {
    await api('/auth/register', { method: 'POST', body: { email, password } })
    await login(email, password)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
