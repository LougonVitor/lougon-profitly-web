import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

interface AuthResponse {
  token: string
  username: string
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
      navigate('/wallet')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  async function register(username: string, email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', { username, email, password })
      localStorage.setItem('profitly_token', res.data.token)
      localStorage.setItem('profitly_username', res.data.username)
      navigate('/wallet')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
      setError(typeof msg === 'string' ? msg : 'Registration failed')
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

  return { login, register, logout, getUsername, isAuthenticated, loading, error }
}
