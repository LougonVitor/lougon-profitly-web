import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../../lib/api'
import './LoginModal.css'

interface AuthResponse {
  token: string
  username: string
}

interface Props {
  onSuccess: () => void
  onDismiss: () => void
}

export function LoginModal({ onSuccess, onDismiss }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { username, password })
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle(credential: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/google', { credential })
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Falha ao entrar com Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lm-backdrop" onClick={e => { if (e.target === e.currentTarget) onDismiss() }}>
      <div className="lm-card" role="dialog" aria-modal="true" aria-label="Entrar na conta">
        <button className="lm-close" onClick={onDismiss} aria-label="Fechar">✕</button>

        <div className="lm-lock-icon">🔒</div>
        <div className="lm-logo">Profitly</div>
        <h2 className="lm-title">Acesso restrito</h2>
        <p className="lm-subtitle">Esta página exige login para exibir seus dados.</p>

        <div className="lm-google-wrap">
          <GoogleLogin
            onSuccess={res => { if (res.credential) handleGoogle(res.credential) }}
            onError={() => {}}
            text="signin_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        <div className="lm-divider"><span>ou entre com sua conta</span></div>

        <form className="lm-form" onSubmit={handleSubmit} noValidate>
          <div className="lm-field">
            <label className="lm-label">Usuário</label>
            <input
              className="lm-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seu_usuario"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="lm-field">
            <label className="lm-label">Senha</label>
            <div className="lm-input-wrap">
              <input
                className="lm-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lm-eye"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="lm-error" role="alert">{error}</div>}

          <button className="lm-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="lm-link-text">
          Não tem conta? <Link className="lm-link" to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
