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

  // Wait for the app profile (volunteer vs. organization) to resolve for this
  // authenticated session before rendering any page. Pages decide their own
  // role-based redirects from userProfile/organizationProfile; rendering them
  // early -- e.g. on the render right after a refresh restores auth.isAuthenticated,
  // before the profile fetch has even started -- would make a still-null profile
  // look like a confirmed "no profile" and send the user to the wrong route.
  if (!auth.isProfileInitialized) {
    return (
      <main>
        <h1>Loading...</h1>
      </main>
    )
  }

  return <Outlet />
}

export default ProtectedRoute