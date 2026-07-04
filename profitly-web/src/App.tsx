import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Wallet } from './pages/Wallet/Wallet'
import { Finance } from './pages/Finance/Finance'
import { Login } from './pages/Login/Login'
import { Register } from './pages/Register/Register'
import { TickerAnalysis } from './pages/TickerAnalysis/TickerAnalysis'
import { Layout } from './components/Layout/Layout'
import { LoginModal } from './components/LoginModal/LoginModal'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './i18n/ThemeContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('profitly_token'))
  const navigate = useNavigate()

  if (authenticated) return <>{children}</>

  return (
    <>
      {/* Page content — blurred and non-interactive until logged in */}
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
        {children}
      </div>

      {/* Login modal on top */}
      <LoginModal
        onSuccess={() => setAuthenticated(true)}
        onDismiss={() => navigate('/')}
      />
    </>
  )
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
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/ticker/:symbol" element={<Layout><TickerAnalysis /></Layout>} />
              {/* Protected routes — show login modal with blurred content behind */}
              <Route path="/wallet" element={<PrivateRoute><Layout><Wallet /></Layout></PrivateRoute>} />
              <Route path="/finance" element={<PrivateRoute><Layout><Finance /></Layout></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App
