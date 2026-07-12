import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('profitly_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const hadToken = !!localStorage.getItem('profitly_token')
      localStorage.removeItem('profitly_token')
      localStorage.removeItem('profitly_username')
      // Keep the current protected route so PrivateRoute renders its login modal
      // over the blurred page. Redirecting to /login bypasses that route and
      // produces the standalone white login screen.
      if (hadToken) window.location.reload()
    }
    return Promise.reject(err)
  }
)
