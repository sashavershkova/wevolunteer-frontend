import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  TeamAccessIcon,
  PermissionsIcon,
  GoogleCalendarIcon,
  SlackIntegrationIcon,
  CsvExportIcon,
  DownloadIcon,
  PasswordIcon,
  TwoFactorIcon,
  SessionManagementIcon,
  DeleteAccountIcon,
} from '../../components/shared/icons'
import './OrganizationSettingsPage.css'

const NOTIFICATION_ROWS = [
  {
    id: 'email-notifications',
    label: 'Email notifications',
    description: 'Receive volunteer registration updates.',
  },
  {
    id: 'opportunity-reminders',
    label: 'Opportunity reminders',
    description: 'Receive reminders before upcoming events.',
  },
  {
    id: 'weekly-summary',
    label: 'Weekly summary',
    description: 'Receive a weekly activity summary.',
  },
]

const INTEGRATION_TILES = [
  {
    id: 'google-calendar',
    Icon: GoogleCalendarIcon,
    title: 'Google Calendar',
    description: 'Automatically sync opportunities.',
    actionLabel: 'Connect',
  },
  {
    id: 'slack',
    Icon: SlackIntegrationIcon,
    title: 'Slack',
    description: 'Receive organization notifications.',
    actionLabel: 'Connect',
  },
  {
    id: 'csv-export',
    Icon: CsvExportIcon,
    title: 'CSV Export',
    description: 'Export volunteer registrations.',
    actionLabel: 'Export',
  },
]

const FUTURE_SETTINGS_FEATURES = [
  'Team collaboration',
  'Advanced notification preferences',
  'Calendar integrations',
  'Data export',
  'Organization verification',
  'Security settings',
]

function OrganizationSettingsPage() {
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

  if (auth.organizationProfile === null) {
    return <Navigate to="/" replace />
  }

  const organization = auth.organizationProfile

  return (
    <main className="organization-settings-page">
      <header className="organization-settings-header">
        <h1>Settings</h1>
        <p className="organization-settings-subtitle">
          Manage your organization&rsquo;s account, team, and preferences.
        </p>
      </header>

      <section className="organization-settings-section" aria-label="Organization information">
        <h2>Organization Information</h2>
        <p className="organization-settings-section-description">
          Basic organization information is managed from your Organization Profile.
        </p>

        <dl className="organization-settings-info-list">
          <div className="organization-settings-info-row">
            <dt>Organization name</dt>
            <dd>{organization.name}</dd>
          </div>
          <div className="organization-settings-info-row">
            <dt>Email</dt>
            <dd>{organization.email}</dd>
          </div>
          <div className="organization-settings-info-row">
            <dt>Website</dt>
            <dd className={organization.website ? undefined : 'organization-settings-muted-value'}>
              {organization.website || 'Not provided'}
            </dd>
          </div>
        </dl>

        <Link to="/organization/profile" className="organization-settings-primary-link">
          View Organization Profile
        </Link>
      </section>

      <div className="organization-settings-columns">
        <section className="organization-settings-tile" aria-label="Team members">
          <TeamAccessIcon className="organization-settings-tile-icon" aria-hidden="true" />
          <div className="organization-settings-tile-heading">
            <h3>Team Members</h3>
            <span className="organization-settings-badge">Coming Soon</span>
          </div>
          <p>Invite teammates to help manage your organization.</p>
          <button type="button" className="organization-settings-button" disabled>
            Manage Team
          </button>
        </section>

        <section className="organization-settings-tile" aria-label="Roles and permissions">
          <PermissionsIcon className="organization-settings-tile-icon" aria-hidden="true" />
          <div className="organization-settings-tile-heading">
            <h3>Roles &amp; Permissions</h3>
            <span className="organization-settings-badge">Coming Soon</span>
          </div>
          <p>Control what different team members can access.</p>
          <button type="button" className="organization-settings-button" disabled>
            Manage Roles
          </button>
        </section>
      </div>

      <section className="organization-settings-section" aria-label="Notifications">
        <div className="organization-settings-section-heading">
          <h2>Notifications</h2>
          <span className="organization-settings-badge">Coming Soon</span>
        </div>

        <ul className="organization-settings-toggle-list">
          {NOTIFICATION_ROWS.map((row) => (
            <li className="organization-settings-toggle-row" key={row.id}>
              <div>
                <p className="organization-settings-toggle-label">{row.label}</p>
                <p className="organization-settings-toggle-description">{row.description}</p>
              </div>
              <input
                type="checkbox"
                className="organization-settings-toggle"
                aria-label={row.label}
                disabled
              />
            </li>
          ))}
        </ul>

        <p className="organization-settings-note">
          Notification preferences will become available in a future update.
        </p>
      </section>

      <section className="organization-settings-section" aria-label="Integrations">
        <div className="organization-settings-section-heading">
          <h2>Integrations</h2>
          <span className="organization-settings-badge">Coming Soon</span>
        </div>

        <div className="organization-settings-integrations">
          {INTEGRATION_TILES.map(({ id, Icon, title, description, actionLabel }) => (
            <div className="organization-settings-integration-tile" key={id}>
              <Icon className="organization-settings-tile-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" className="organization-settings-button" disabled>
                {actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="organization-settings-section" aria-label="Security">
        <div className="organization-settings-section-heading">
          <h2>Security</h2>
          <span className="organization-settings-badge">Coming Soon</span>
        </div>

        <ul className="organization-settings-row-list">
          <li className="organization-settings-row">
            <PasswordIcon className="organization-settings-row-icon" aria-hidden="true" />
            <div className="organization-settings-row-text">
              <p className="organization-settings-row-label">Password</p>
              <p className="organization-settings-row-description">
                Managed through Amazon Cognito.
              </p>
            </div>
            <button type="button" className="organization-settings-button" disabled>
              Manage Password
            </button>
          </li>

          <li className="organization-settings-row">
            <TwoFactorIcon className="organization-settings-row-icon" aria-hidden="true" />
            <div className="organization-settings-row-text">
              <p className="organization-settings-row-label">Two-factor authentication</p>
            </div>
            <span className="organization-settings-muted-value">Coming Soon</span>
          </li>

          <li className="organization-settings-row">
            <SessionManagementIcon className="organization-settings-row-icon" aria-hidden="true" />
            <div className="organization-settings-row-text">
              <p className="organization-settings-row-label">Session management</p>
            </div>
            <span className="organization-settings-muted-value">Coming Soon</span>
          </li>
        </ul>
      </section>

      <section className="organization-settings-section" aria-label="Data and privacy">
        <div className="organization-settings-section-heading">
          <h2>Data &amp; Privacy</h2>
          <span className="organization-settings-badge">Coming Soon</span>
        </div>

        <ul className="organization-settings-row-list">
          <li className="organization-settings-row">
            <DownloadIcon className="organization-settings-row-icon" aria-hidden="true" />
            <div className="organization-settings-row-text">
              <p className="organization-settings-row-label">Download organization data</p>
              <p className="organization-settings-row-description">
                Export a copy of your organization&rsquo;s information and activity.
              </p>
            </div>
            <button type="button" className="organization-settings-button" disabled>
              Download
            </button>
          </li>

          <li className="organization-settings-row organization-settings-row-danger">
            <DeleteAccountIcon className="organization-settings-row-icon" aria-hidden="true" />
            <div className="organization-settings-row-text">
              <p className="organization-settings-row-label">Delete organization account</p>
              <p className="organization-settings-row-description">
                Permanently delete your organization account and all associated data.
              </p>
            </div>
            <button
              type="button"
              className="organization-settings-button organization-settings-button-danger"
              disabled
            >
              Delete Account
            </button>
          </li>
        </ul>
      </section>

      <section className="organization-settings-future-panel" aria-label="Planned settings features">
        <h2>More settings are on the way</h2>
        <p>
          We&rsquo;re planning additional organization management features including:
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

export default OrganizationSettingsPage
