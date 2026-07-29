import { useAppAuth } from '../../contexts/AuthContext'
import { SaveIcon } from '../../components/shared/icons'
import './LoginPage.css'

function LoginPage() {
  const auth = useAppAuth()

  return (
    <main className="login-page">
      <div className="login-page-shape login-page-shape-one" aria-hidden="true" />
      <div className="login-page-shape login-page-shape-two" aria-hidden="true" />

      <section className="login-card">
        <div className="login-card-brand">
          <span className="login-card-logo" aria-hidden="true">
            <SaveIcon />
          </span>
          <h1>WeVolunteer</h1>
        </div>

        <p className="login-card-subtitle">
          Sign in to find volunteer opportunities and manage your community impact.
        </p>

        <button type="button" className="login-button" onClick={auth.signIn}>
          Sign in
        </button>

        <p className="login-signup-prompt">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="login-signup-link"
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
