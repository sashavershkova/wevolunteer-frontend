import { useEffect, useState } from 'react'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getCurrentUser,
  type UserProfile,
} from '../../services/api/userService'


function OpportunitiesPage() {
  const auth = useAppAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!auth.accessToken) {
        return
      }

      const user = await getCurrentUser(auth.accessToken)
      setProfile(user)
    }

    void loadProfile()
  }, [auth.accessToken])

  return (
    <main>
      <h1>Opportunities</h1>

      {profile && (
        <>
          <p>Welcome, {profile.name}!</p>
          <p>Role: {profile.role}</p>
        </>
      )}

      <button onClick={auth.signOut}>Sign out</button>
    </main>
  )
}

export default OpportunitiesPage