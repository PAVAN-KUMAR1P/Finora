import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isLogin && password.length < 8) return setError('Password must be at least 8 characters')
    setBusy(true)
    try {
      await (isLogin ? login : register)(email.trim(), password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">₹</span>
          Finly
        </div>
        <div>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted small" style={{ margin: '0.3rem 0 0' }}>
            {isLogin ? 'Log in to see your spending at a glance.' : 'Start tracking your expenses in minutes.'}
          </p>
        </div>
        <label>
          Email
          <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy} style={{ justifyContent: 'center' }}>
          {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
        </button>
        <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
          {isLogin ? <>No account? <Link to="/register">Register</Link></> : <>Have an account? <Link to="/login">Log in</Link></>}
        </p>
      </form>
    </div>
  )
}
