import { Outlet } from 'react-router-dom'
import Header from '../components/navigation/Header/Header'
import Sidebar from '../components/navigation/Sidebar/Sidebar'
import './AppLayout.css'

function AppLayout() {
  return (
    <>
      <Header />
      <div className="app-shell">
        <Sidebar />
        <div className="app-shell-content">
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default AppLayout
