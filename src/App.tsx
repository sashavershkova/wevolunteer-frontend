import { useAppAuth } from './contexts/AuthContext'
import './App.css'

function App() {
  const auth = useAppAuth()

  if (auth.isLoading) {
    return <main><h1>Loading...</h1></main>
  }

  if (auth.errorMessage) {
    return <main><h1>Auth error</h1><p>{auth.errorMessage}</p></main>
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

  return (
    <main>
      <h1>Welcome to WeVolunteer</h1>
      <p><strong>Email:</strong> {auth.email}</p>
      <p><strong>User ID:</strong> {auth.userId}</p>

      <button onClick={auth.signOut}>Sign out</button>
    </main>
  )
}

export default App