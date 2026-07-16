import { Outlet } from 'react-router-dom'
import { useAppAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/Login/LoginPage'

function ProtectedRoute() {
  const auth = useAppAuth()

  if (auth.isLoading) {
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    )
  }

  if (auth.errorMessage) {
    return (
      <main>
        <h1>Auth error</h1>
        <p>{auth.errorMessage}</p>
      </main>
    )
  }

  if (!auth.isAuthenticated) {
    return <LoginPage />
  }

  return <Outlet />
}

export default ProtectedRoute