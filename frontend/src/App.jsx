import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Budgets from './pages/Budgets.jsx'
import FixedDeposits from './pages/FixedDeposits.jsx'
import Investments from './pages/Investments.jsx'
import Reports from './pages/Reports.jsx'
import Layout from './components/Layout.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="center muted">Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="center muted">Loading…</div>
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="fixed-deposits" element={<FixedDeposits />} />
        <Route path="investments" element={<Investments />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
