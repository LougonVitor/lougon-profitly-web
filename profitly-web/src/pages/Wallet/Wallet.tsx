import { Header } from '../../components/Header/Header'
import { WalletCard } from '../../components/WalletCard/WalletCard'
import { PositionTable } from '../../components/PositionTable/PositionTable'
import { useWallets } from '../../hooks/useWallets'
import './Wallet.css'

export function Wallet() {
  const { wallets, loading, error } = useWallets()

  if (loading) return (
    <div className="wallet-page">
      <Header />
      <div className="wallet-skeleton">
        <div className="skeleton-card" />
        <div className="skeleton-table" />
      </div>
    </div>
  )

  if (error) return (
    <div className="wallet-page">
      <Header />
      <div className="wallet-state wallet-state--error">Failed to load wallets: {error}</div>
    </div>
  )

  return (
    <div className="wallet-page">
      <Header />

      {wallets.length === 0 && (
        <div className="wallet-state">No wallets found.</div>
      )}

      {wallets.map((wallet, i) => (
        <div key={wallet.id} className="wallet-section">
          <WalletCard wallet={wallet} index={i} />
          <PositionTable positions={wallet.positions} />
        </div>
      ))}
    </div>
  )
}
