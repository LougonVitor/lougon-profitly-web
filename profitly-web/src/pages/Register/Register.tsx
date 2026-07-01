import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import '../Login/Login.css'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Fraca', color: '#e24b4a' }
  if (score <= 2) return { score, label: 'Regular', color: '#f59e0b' }
  if (score <= 3) return { score, label: 'Boa', color: '#3b82f6' }
  return { score, label: 'Forte', color: '#22c55e' }
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function Register() {
  const { register, googleLogin, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailConsent, setEmailConsent] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const strength = passwordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setClientError(null)
    if (password !== confirmPassword) {
      setClientError('As senhas não coincidem')
      return
    }
    await register({ username, email, phone, password, confirmPassword, emailConsent, smsConsent })
  }

  const displayError = clientError ?? error

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">Profitly</div>
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Comece a acompanhar seus investimentos hoje.</p>

        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={res => { if (res.credential) googleLogin(res.credential) }}
            onError={() => {}}
            text="signup_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        <div className="auth-divider"><span>ou crie com e-mail</span></div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label">Usuário <span className="auth-req">*</span></label>
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
              <span className="auth-hint">Apenas letras, números e _</span>
            </div>

            <div className="auth-field">
              <label className="auth-label">Telefone <span className="auth-req">*</span></label>
              <input
                className="auth-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">E-mail <span className="auth-req">*</span></label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label">Senha <span className="auth-req">*</span></label>
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
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
              {password && (
                <div className="auth-strength">
                  <div className="auth-strength-bar">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="auth-strength-seg"
                        style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              <span className="auth-hint">Mín. 8 caracteres, 1 maiúscula, 1 número</span>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirmar senha <span className="auth-req">*</span></label>
              <div className="auth-input-wrap">
                <input
                  className={`auth-input ${confirmPassword && confirmPassword !== password ? 'auth-input--error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <span className="auth-match-icon">
                    {confirmPassword === password ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="auth-consents">
            <label className="auth-consent">
              <input
                type="checkbox"
                checked={emailConsent}
                onChange={e => setEmailConsent(e.target.checked)}
              />
              <span>
                Aceito receber comunicações e ofertas por <strong>e-mail</strong>
              </span>
            </label>
            <label className="auth-consent">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={e => setSmsConsent(e.target.checked)}
              />
              <span>
                Aceito receber comunicações e ofertas por <strong>SMS / WhatsApp</strong>
              </span>
            </label>
            <p className="auth-consent-note">
              Ao criar sua conta, você concorda com nossos{' '}
              <a href="#" className="auth-link">Termos de Uso</a> e{' '}
              <a href="#" className="auth-link">Política de Privacidade</a>.
            </p>
          </div>

          {displayError && <div className="auth-error" role="alert">{displayError}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-link-text">
          Já tem conta? <Link className="auth-link" to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
