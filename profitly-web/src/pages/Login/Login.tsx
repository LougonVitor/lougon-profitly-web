import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import './Login.css'

export function Login() {
  const { login, googleLogin, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login(username, password)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Profitly</div>
        <h1 className="auth-title">Bem-vindo de volta</h1>
        <p className="auth-subtitle">Acompanhe seus investimentos com inteligência.</p>

        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={res => { if (res.credential) googleLogin(res.credential) }}
            onError={() => {}}
            text="signin_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        <div className="auth-divider"><span>ou entre com sua conta</span></div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">Usuário</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seu_usuario"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-link-text">
          Não tem conta? <Link className="auth-link" to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
