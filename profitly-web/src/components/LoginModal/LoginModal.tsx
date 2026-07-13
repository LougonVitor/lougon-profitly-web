import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../../lib/api'
import { useTheme } from '../../i18n/ThemeContext'
import logoLight from '../../assets/profitly-logo-light.svg'
import logoDark from '../../assets/profitly-logo-dark.svg'
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
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        <img className="lm-brand" src={theme === 'dark' ? logoDark : logoLight} alt="Profitly" />
        <h2 className="lm-title">Acesso restrito</h2>
        <p className="lm-subtitle">Entre com sua conta Google para ver seus dados.</p>

        <div className="lm-google-wrap">
          <GoogleLogin
            onSuccess={res => { if (res.credential) handleGoogle(res.credential) }}
            onError={() => setError('Falha ao entrar com Google')}
            text="signin_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        {loading && <p className="lm-loading">Entrando...</p>}
        {error && <div className="lm-error" role="alert">{error}</div>}
      </div>
    </div>
  )
}
