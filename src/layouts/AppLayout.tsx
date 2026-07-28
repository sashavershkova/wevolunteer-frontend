import { Outlet } from 'react-router-dom'
import Header from '../components/navigation/Header/Header'

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default AppLayout
