import { Header } from '../Header/Header'
import './Layout.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="layout-content">
        {children}
      </div>
    </>
  )
}
