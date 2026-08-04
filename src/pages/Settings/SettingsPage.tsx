import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  GoogleCalendarIcon,
  CsvExportIcon,
  DownloadIcon,
  PasswordIcon,
  TwoFactorIcon,
  SessionManagementIcon,
  DeleteAccountIcon,
} from '../../components/shared/icons'
import './SettingsPage.css'

const NOTIFICATION_ROWS = [
  {
    id: 'email-notifications',
    label: 'Email notifications',
    description: 'Receive updates about your registrations.',
  },
  {
    id: 'opportunity-reminders',
    label: 'Opportunity reminders',
    description: 'Receive reminders before opportunities you signed up for.',
  },
  {
    id: 'new-opportunity-alerts',
    label: 'New opportunity alerts',
    description: 'Hear about new opportunities from organizations you follow.',
  },
]

const INTEGRATION_TILES = [
  {
    id: 'google-calendar',
    Icon: GoogleCalendarIcon,
    title: 'Google Calendar',
    description: 'Automatically sync opportunities you register for.',
    actionLabel: 'Connect',
  },
  {
    id: 'csv-export',
    Icon: CsvExportIcon,
    title: 'CSV Export',
    description: 'Export your volunteer history and hours.',
    actionLabel: 'Export',
  },
]

const FUTURE_SETTINGS_FEATURES = [
  'Advanced notification preferences',
  'Calendar integrations',
  'Interest and skill preferences',
  'Volunteer hours export',
  'Security settings',
]

function SettingsPage() {
  const auth = useAppAuth()

  if (auth.isProfileLoading) {
    return (
      <main>
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main>
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization/settings" replace />
  }

  if (auth.userProfile === null) {
    return <Navigate to="/" replace />
  }

  const user = auth.userProfile

  return (
    <main className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">
          Manage your account and preferences.
        </p>
      </header>

      <section className="settings-section" aria-label="Account information">
        <h2>Account Information</h2>
        <p className="settings-section-description">
          Basic account information is managed from your profile.
        </p>

        <dl className="settings-info-list">
          <div className="settings-info-row">
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="settings-info-row">
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="settings-info-row">
            <dt>Account type</dt>
            <dd>Volunteer</dd>
          </div>
        </dl>

        <Link to="/profile" className="settings-primary-link">
          View My Profile
        </Link>
      </section>

      <section className="settings-section" aria-label="Notifications">
        <div className="settings-section-heading">
          <h2>Notifications</h2>
          <span className="settings-badge">Coming Soon</span>
        </div>

        <ul className="settings-toggle-list">
          {NOTIFICATION_ROWS.map((row) => (
            <li className="settings-toggle-row" key={row.id}>
              <div>
                <p className="settings-toggle-label">{row.label}</p>
                <p className="settings-toggle-description">{row.description}</p>
              </div>
              <input
                type="checkbox"
                className="settings-toggle"
                aria-label={row.label}
                disabled
              />
            </li>
          ))}
        </ul>

        <p className="settings-note">
          Notification preferences will become available in a future update.
        </p>
      </section>

      <section className="settings-section" aria-label="Integrations">
        <div className="settings-section-heading">
          <h2>Integrations</h2>
          <span className="settings-badge">Coming Soon</span>
        </div>

        <div className="settings-integrations">
          {INTEGRATION_TILES.map(({ id, Icon, title, description, actionLabel }) => (
            <div className="settings-integration-tile" key={id}>
              <Icon className="settings-tile-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" className="settings-button" disabled>
                {actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-label="Security">
        <div className="settings-section-heading">
          <h2>Security</h2>
          <span className="settings-badge">Coming Soon</span>
        </div>

        <ul className="settings-row-list">
          <li className="settings-row">
            <PasswordIcon className="settings-row-icon" aria-hidden="true" />
            <div className="settings-row-text">
              <p className="settings-row-label">Password</p>
              <p className="settings-row-description">
                Managed through Amazon Cognito.
              </p>
            </div>
            <button type="button" className="settings-button" disabled>
              Manage Password
            </button>
          </li>

          <li className="settings-row">
            <TwoFactorIcon className="settings-row-icon" aria-hidden="true" />
            <div className="settings-row-text">
              <p className="settings-row-label">Two-factor authentication</p>
            </div>
            <span className="settings-muted-value">Coming Soon</span>
          </li>

          <li className="settings-row">
            <SessionManagementIcon className="settings-row-icon" aria-hidden="true" />
            <div className="settings-row-text">
              <p className="settings-row-label">Session management</p>
            </div>
            <span className="settings-muted-value">Coming Soon</span>
          </li>
        </ul>
      </section>

      <section className="settings-section" aria-label="Data and privacy">
        <div className="settings-section-heading">
          <h2>Data &amp; Privacy</h2>
          <span className="settings-badge">Coming Soon</span>
        </div>

        <ul className="settings-row-list">
          <li className="settings-row">
            <DownloadIcon className="settings-row-icon" aria-hidden="true" />
            <div className="settings-row-text">
              <p className="settings-row-label">Download my data</p>
              <p className="settings-row-description">
                Export a copy of your account information and volunteer activity.
              </p>
            </div>
            <button type="button" className="settings-button" disabled>
              Download
            </button>
          </li>

          <li className="settings-row settings-row-danger">
            <DeleteAccountIcon className="settings-row-icon" aria-hidden="true" />
            <div className="settings-row-text">
              <p className="settings-row-label">Delete account</p>
              <p className="settings-row-description">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <button
              type="button"
              className="settings-button settings-button-danger"
              disabled
            >
              Delete Account
            </button>
          </li>
        </ul>
      </section>

      <section className="settings-future-panel" aria-label="Planned settings features">
        <h2>More settings are on the way</h2>
        <p>
          We&rsquo;re planning additional account features including:
        </p>
        <ul>
          {FUTURE_SETTINGS_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default SettingsPage
