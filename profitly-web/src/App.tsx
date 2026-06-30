import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Wallet } from './pages/Wallet/Wallet'
import { Login } from './pages/Login/Login'
import { Register } from './pages/Register/Register'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './i18n/ThemeContext'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem('profitly_token')
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
