import { Header } from '../../components/Header/Header'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { useWallets } from '../../hooks/useWallets'
import './Wallet.css'

export function Wallet() {
  const { wallets, loading, error } = useWallets()

  if (loading) return <div className="wallet-state">Loading wallets...</div>
  if (error) return <div className="wallet-state wallet-state--error">Error: {error}</div>

  return (
    <div className="wallet-page">
      <Header />

      {wallets.length === 0 && (
        <div className="wallet-state">No wallets found.</div>
      )}

      {wallets.map(wallet => (
        <div key={wallet.id} className="wallet-section">
          <WalletCard wallet={wallet} />
          <PositionTable positions={wallet.positions} />
        </div>
      ))}
    </div>
  )
}
