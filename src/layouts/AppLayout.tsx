import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/navigation/Header/Header'
import Sidebar from '../components/navigation/Sidebar/Sidebar'
import Footer from '../components/navigation/Footer/Footer'
import './AppLayout.css'

function AppLayout() {
  const location = useLocation()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  return (
    <>
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        onMobileSidebarToggle={() => setIsMobileSidebarOpen((open) => !open)}
      />
      <div className="app-shell">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="app-shell-content">
          <Outlet />
        </div>
      </div>
      <Footer />
    </>
  )
}

export default AppLayout
