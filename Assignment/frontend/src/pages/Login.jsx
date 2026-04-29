import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, getMe } from '../api/auth'
import { useAuth } from '../store/authStore'

export default function Login() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError]           = useState('')
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading]       = useState(false)
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password)
        setRegistered(true)
        setIsRegister(false)
        setPassword('')
        setLoading(false)
        return
      }

      const { data } = await login(email, password)
      localStorage.setItem('token', data.access_token)
      const meRes = await getMe()
      saveToken(data.access_token, meRes.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-logo-icon">⚡</div>
          <h1>Dealer<span>Creative</span></h1>
          <p>Automated social creatives for automotive dealerships</p>
        </div>

        <div className="auth-card">
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>

          {registered && (
            <div style={{
              background: '#d1fae5', border: '1px solid #6ee7b7',
              borderRadius: 8, padding: '12px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>Account created successfully!</p>
                <p style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>Please sign in with your new credentials.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', marginTop: 6, padding: '12px' }}>
              {loading ? '…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="auth-toggle">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => { setIsRegister(!isRegister); setError(''); setRegistered(false) }}>
              {isRegister ? 'Sign in' : 'Register'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
