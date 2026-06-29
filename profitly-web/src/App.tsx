import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Wallet } from './pages/Wallet/Wallet'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App