import { Outlet } from 'react-router-dom'
import { useAppAuth } from '../contexts/AuthContext'

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
    return (
      <main>
        <h1>WeVolunteer</h1>
        <p>Please sign in to continue.</p>
        <button onClick={auth.signIn}>Sign in</button>
      </main>
    )
  }

  return <Outlet />
}

export default ProtectedRoute