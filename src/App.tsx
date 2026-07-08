import { useAuth } from 'react-oidc-context'
import './App.css'

function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <main><h1>Loading...</h1></main>
  }

  if (auth.error) {
    return <main><h1>Auth error</h1><p>{auth.error.message}</p></main>
  }

  if (!auth.isAuthenticated) {
    return (
      <main>
        <h1>WeVolunteer</h1>
        <p>Please sign in to continue.</p>
        <button onClick={() => auth.signinRedirect()}>Sign in</button>
      </main>
    )
  }

  return (
    <main>
      <h1>Welcome to WeVolunteer</h1>
      <p><strong>Email:</strong> {auth.user?.profile.email}</p>
      <p><strong>User ID:</strong> {auth.user?.profile.sub}</p>

      <button onClick={() => auth.removeUser()}>Sign out</button>
    </main>
  )
}

export default App