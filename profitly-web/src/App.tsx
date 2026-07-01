import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Wallet } from './pages/Wallet/Wallet'
import { Login } from './pages/Login/Login'
import { Register } from './pages/Register/Register'
import { TickerAnalysis } from './pages/TickerAnalysis/TickerAnalysis'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './i18n/ThemeContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('profitly_token')
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Public routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/ticker/:symbol" element={<TickerAnalysis />} />
              {/* Protected routes — require login */}
              <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App
