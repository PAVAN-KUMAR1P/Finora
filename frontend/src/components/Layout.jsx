import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import {
  BarChartIcon, ChevronDownIcon, GridIcon, LandmarkIcon,
  LogoutIcon, MenuIcon, PieIcon, ReceiptIcon, TrendIcon,
} from './icons.jsx'

const GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Overview', icon: GridIcon, end: true },
      { to: '/transactions', label: 'Transactions', icon: ReceiptIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/budgets', label: 'Budgets', icon: PieIcon },
      { to: '/fixed-deposits', label: 'Fixed Deposits', icon: LandmarkIcon },
      { to: '/investments', label: 'Investments', icon: TrendIcon },
      { to: '/reports', label: 'Reports', icon: BarChartIcon },
    ],
  },
]
const TITLES = { '/': 'Overview', '/transactions': 'Transactions', '/budgets': 'Budgets', '/fixed-deposits': 'Fixed Deposits', '/investments': 'Investments', '/reports': 'Reports' }

export default function Layout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setOpen(false); setProfileOpen(false) }, [location.pathname])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && (setOpen(false), setProfileOpen(false))
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const initial = user.email[0].toUpperCase()
  const title = TITLES[location.pathname] ?? 'Finly'

  return (
    <div className="layout">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary">
        <div className="brand">
          <span className="brand-mark">₹</span>
          Finly
        </div>
        {GROUPS.map((g) => (
          <div key={g.label} className="sidebar-group">
            <div className="sidebar-section-label">{g.label}</div>
            <nav>
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
        <div className="sidebar-spacer" />
      </aside>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="content-area">
        <header className="topbar">
          <div className="row">
            <button className="btn icon menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><MenuIcon /></button>
            <h1>{title}</h1>
          </div>
          <div className="profile-menu">
            <button className="profile-btn" aria-haspopup="menu" aria-expanded={profileOpen} aria-label="Account menu" onClick={() => setProfileOpen((v) => !v)}>
              <span className="avatar">{initial}</span>
              <span className="small ellipsis" style={{ maxWidth: 140 }}>{user.email}</span>
              <ChevronDownIcon size={14} />
            </button>
            {profileOpen && (
              <>
                <div className="backdrop-click" onClick={() => setProfileOpen(false)} />
                <div className="profile-dropdown" role="menu">
                  <div className="email">
                    <strong className="small">Signed in as</strong>
                    <span className="muted ellipsis">{user.email}</span>
                  </div>
                  <button className="dropdown-item danger" role="menuitem" onClick={logout}>
                    <LogoutIcon size={16} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="main" id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
