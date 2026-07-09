import { useAppAuth } from '../../contexts/AuthContext'

function OpportunitiesPage() {
  const auth = useAppAuth()

  return (
    <main>
      <h1>Opportunities</h1>

      <button onClick={auth.signOut}>Sign out</button>
    </main>
  )
}

export default OpportunitiesPage