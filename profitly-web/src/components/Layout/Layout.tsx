import { Header } from '../Header/Header'
import { TickerTape } from '../TickerTape/TickerTape'
import './Layout.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="layout-content">
        <TickerTape />
        <div className="layout-body">
          {children}
        </div>
      </div>
    </>
  )
}
