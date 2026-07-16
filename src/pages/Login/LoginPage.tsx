import { useAppAuth } from '../../contexts/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const auth = useAppAuth()

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>WeVolunteer</h1>
        <p>Please sign in to continue.</p>

        <button
          type="button"
          className="login-button"
          onClick={auth.signIn}
        >
          Sign in
        </button>

        <p className="signup-prompt">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="signup-link"
            onClick={auth.signUp}
          >
            Sign up
          </button>
        </p>
      </section>
    </main>
  )
}

export default LoginPage