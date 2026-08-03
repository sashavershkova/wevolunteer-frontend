import { Navigate } from 'react-router-dom'
import { useAppAuth } from '../contexts/AuthContext'

function HomeRoute() {
  const auth = useAppAuth()

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    )
  }

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export default HomeRoute
