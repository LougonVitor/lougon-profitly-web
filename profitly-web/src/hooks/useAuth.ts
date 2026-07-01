import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

interface AuthResponse {
  token: string
  username: string
}

interface RegisterData {
  username: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  emailConsent: boolean
  smsConsent: boolean
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function login(username: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { username, password })
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  async function googleLogin(credential: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/google', { credential })
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Falha ao entrar com Google')
    } finally {
      setLoading(false)
    }
  }

  async function register(data: RegisterData) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', data)
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('profitly_token')
    localStorage.removeItem('profitly_username')
    navigate('/login')
  }

  function getUsername(): string | null {
    return localStorage.getItem('profitly_username')
  }

  function isAuthenticated(): boolean {
    return !!localStorage.getItem('profitly_token')
  }

  return { login, register, googleLogin, logout, getUsername, isAuthenticated, loading, error }
}
