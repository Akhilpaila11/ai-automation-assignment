import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateJob from './pages/CreateJob'
import JobHistory from './pages/JobHistory'

function Nav() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  if (!user) return null

  return (
    <nav>
      <Link to="/dashboard" className="nav-brand">
        <div className="nav-logo-icon">⚡</div>
        <span className="nav-brand-name">Dealer<span>Creative</span></span>
      </Link>

      <div className="nav-links">
        <Link to="/dashboard" className={pathname === '/dashboard' ? 'nav-active' : ''}>Dashboard</Link>
        <Link to="/create"    className={pathname === '/create'    ? 'nav-active' : ''}>New Job</Link>
        <Link to="/jobs"      className={pathname === '/jobs'      ? 'nav-active' : ''}>Job History</Link>
      </div>

      <div className="nav-right">
        <span className="nav-email">{user.email}</span>
        <button className="secondary" onClick={logout} style={{ padding: '6px 14px', fontSize: 13 }}>
          Logout
        </button>
      </div>
    </nav>
  )
}

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/create" element={<Protected><CreateJob /></Protected>} />
        <Route path="/jobs" element={<Protected><JobHistory /></Protected>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
