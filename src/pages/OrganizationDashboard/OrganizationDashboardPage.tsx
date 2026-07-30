import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyOrganizationOpportunities,
  updateCurrentOrganization,
  type OrganizationProfile,
  type UpdateOrganizationProfileRequest,
} from '../../services/api/organizationService'
import { closeOpportunity, deleteOpportunity } from '../../services/api/opportunityService'
import OrganizationOpportunitiesTable from '../../components/organization/OrganizationOpportunitiesTable/OrganizationOpportunitiesTable'
import { OrganizationIcon, EditIcon } from '../../components/shared/icons'
import type { Opportunity } from '../../types/Opportunity'
import { isPastOpportunityDate } from '../../utils/isPastOpportunityDate'
import './OrganizationDashboardPage.css'

type OrganizationFormState = {
  name: string
  description: string
  email: string
  website: string
}

type OrganizationFormErrors = Partial<Record<'name' | 'email', string>>

function buildOrganizationFormState(organization: OrganizationProfile): OrganizationFormState {
  return {
    name: organization.name,
    description: organization.description,
    email: organization.email,
    website: organization.website,
  }
}

function validateOrganizationForm(form: OrganizationFormState): OrganizationFormErrors {
  const errors: OrganizationFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Organization name is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  }

  return errors
}

function OrganizationDashboardPage() {
  const auth = useAppAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = auth
  const opportunitiesSectionRef = useRef<HTMLElement>(null)

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] =
    useState<string | null>(null)
  const [closingOpportunityId, setClosingOpportunityId] =
    useState<string | null>(null)
  const [deletingOpportunityId, setDeletingOpportunityId] =
    useState<string | null>(null)
  const [opportunityActionErrorMessage, setOpportunityActionErrorMessage] =
    useState<string | null>(null)

  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [organizationForm, setOrganizationForm] =
    useState<OrganizationFormState | null>(null)
  const [organizationFormErrors, setOrganizationFormErrors] =
    useState<OrganizationFormErrors>({})
  const [isSavingOrganization, setIsSavingOrganization] = useState(false)
  const [organizationSaveError, setOrganizationSaveError] =
    useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const loadOpportunities = async () => {
      setIsOpportunitiesLoading(true)
      setOpportunitiesError(null)

      try {
        const result = await getMyOrganizationOpportunities(accessToken)

        if (!ignore) {
          setOpportunities(result)
        }
      } catch (error) {
        if (!ignore) {
          setOpportunitiesError(
            error instanceof Error
              ? error.message
              : 'Unable to load your opportunities.',
          )
        }
      } finally {
        if (!ignore) {
          setIsOpportunitiesLoading(false)
        }
      }
    }

    void loadOpportunities()

    return () => {
      ignore = true
    }
  }, [accessToken])

  useEffect(() => {
    if (location.pathname === '/organization/opportunities') {
      opportunitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.pathname])

  async function handleCloseOpportunity(opportunityId: string) {
    if (!accessToken) {
      setOpportunityActionErrorMessage('Your authentication session is unavailable.')
      return
    }

    setOpportunityActionErrorMessage(null)
    setClosingOpportunityId(opportunityId)

    try {
      const updatedOpportunity = await closeOpportunity(accessToken, opportunityId)

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.opportunityId === updatedOpportunity.opportunityId
            ? updatedOpportunity
            : opportunity,
        ),
      )
    } catch (error) {
      setOpportunityActionErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to close this opportunity.',
      )
    } finally {
      setClosingOpportunityId(null)
    }
  }

  async function handleDeleteOpportunity(opportunityId: string) {
    if (!accessToken) {
      setOpportunityActionErrorMessage('Your authentication session is unavailable.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this opportunity? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    setOpportunityActionErrorMessage(null)
    setDeletingOpportunityId(opportunityId)

    try {
      await deleteOpportunity(accessToken, opportunityId)

      setOpportunities((current) =>
        current.filter((opportunity) => opportunity.opportunityId !== opportunityId),
      )
    } catch (error) {
      setOpportunityActionErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete this opportunity.',
      )
    } finally {
      setDeletingOpportunityId(null)
    }
  }

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

  const showMetricsPlaceholder = isOpportunitiesLoading || opportunitiesError !== null

  const activeOpportunitiesCount = opportunities.filter(
    (opportunity) =>
      !isPastOpportunityDate(opportunity.date) && opportunity.status === 'OPEN',
  ).length

  const closedOpportunitiesCount = opportunities.filter(
    (opportunity) =>
      !isPastOpportunityDate(opportunity.date) && opportunity.status === 'CLOSED',
  ).length

  const completedOpportunitiesCount = opportunities.filter((opportunity) =>
    isPastOpportunityDate(opportunity.date),
  ).length

  const activeRegistrationsCount = opportunities
    .filter((opportunity) => !isPastOpportunityDate(opportunity.date))
    .reduce((total, opportunity) => total + opportunity.registeredCount, 0)

  const activeCapacity = opportunities
    .filter((opportunity) => !isPastOpportunityDate(opportunity.date))
    .reduce((total, opportunity) => total + opportunity.capacity, 0)

  function formatMetric(value: number): string {
    return showMetricsPlaceholder ? '—' : String(value)
  }

  function handleStartEditingOrganization() {
    setOrganizationForm(buildOrganizationFormState(organization))
    setOrganizationFormErrors({})
    setOrganizationSaveError(null)
    setIsEditingOrganization(true)
  }

  function handleCancelEditingOrganization() {
    setOrganizationForm(buildOrganizationFormState(organization))
    setOrganizationFormErrors({})
    setOrganizationSaveError(null)
    setIsEditingOrganization(false)
  }

  function handleOrganizationFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target
    setOrganizationForm((current) => (current ? { ...current, [name]: value } : current))
  }

  async function handleSaveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSavingOrganization || !organizationForm) {
      return
    }

    const validationErrors = validateOrganizationForm(organizationForm)
    setOrganizationFormErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (!accessToken) {
      setOrganizationSaveError('Your authentication session is unavailable.')
      return
    }

    setOrganizationSaveError(null)
    setIsSavingOrganization(true)

    const request: UpdateOrganizationProfileRequest = {
      name: organizationForm.name,
      description: organizationForm.description,
      email: organizationForm.email,
      website: organizationForm.website,
    }

    try {
      const updatedOrganization = await updateCurrentOrganization(accessToken, request)
      auth.updateOrganizationProfile(updatedOrganization)
      setIsEditingOrganization(false)
    } catch (error) {
      setOrganizationSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to update organization information.',
      )
    } finally {
      setIsSavingOrganization(false)
    }
  }

  return (
    <main className="organization-dashboard-page">
      <header className="organization-dashboard-header">
        <h1>Organization Dashboard</h1>
        <p className="organization-dashboard-subtitle">
          Manage your opportunities and connect with volunteers.
        </p>
      </header>

      <section
        className="organization-dashboard-metrics"
        aria-label="Opportunity metrics"
        aria-live="polite"
      >
        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Active Opportunities</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(activeOpportunitiesCount)}
          </p>
          <p className="organization-dashboard-metric-hint">Currently open</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Closed Opportunities</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(closedOpportunitiesCount)}
          </p>
          <p className="organization-dashboard-metric-hint">No longer accepting volunteers</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Completed Opportunities</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(completedOpportunitiesCount)}
          </p>
          <p className="organization-dashboard-metric-hint">Opportunity date has passed</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Active Registrations</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(activeRegistrationsCount)}
          </p>
          <p className="organization-dashboard-metric-hint">Across current opportunities</p>
        </div>

        <div className="organization-dashboard-metric-card">
          <p className="organization-dashboard-metric-label">Active Capacity</p>
          <p className="organization-dashboard-metric-value">
            {formatMetric(activeCapacity)}
          </p>
          <p className="organization-dashboard-metric-hint">Current volunteer spots offered</p>
        </div>
      </section>

      <section
        className="organization-dashboard-overview"
        aria-label="Organization overview"
      >
        <div className="organization-dashboard-profile">
          <div className="organization-dashboard-logo-placeholder">
            <div className="organization-dashboard-logo-circle">
              <OrganizationIcon aria-hidden="true" />
            </div>
            <button type="button" className="organization-dashboard-upload-button" disabled>
              Upload logo
            </button>
            <p className="organization-dashboard-logo-note">
              Logo upload will be available soon.
            </p>
          </div>

          <div className="organization-dashboard-details">
            {isEditingOrganization && organizationForm ? (
              <form
                className="organization-dashboard-edit-form"
                onSubmit={handleSaveOrganization}
                noValidate
              >
                <div className="organization-dashboard-edit-field">
                  <label htmlFor="organization-name">Organization name</label>
                  <input
                    id="organization-name"
                    name="name"
                    type="text"
                    value={organizationForm.name}
                    onChange={handleOrganizationFieldChange}
                    required
                    disabled={isSavingOrganization}
                    aria-invalid={Boolean(organizationFormErrors.name)}
                    aria-describedby={
                      organizationFormErrors.name ? 'organization-name-error' : undefined
                    }
                  />
                  {organizationFormErrors.name && (
                    <p
                      id="organization-name-error"
                      className="organization-dashboard-edit-error"
                      role="alert"
                    >
                      {organizationFormErrors.name}
                    </p>
                  )}
                </div>

                <div className="organization-dashboard-edit-field">
                  <label htmlFor="organization-description">Description</label>
                  <textarea
                    id="organization-description"
                    name="description"
                    value={organizationForm.description}
                    onChange={handleOrganizationFieldChange}
                    disabled={isSavingOrganization}
                  />
                </div>

                <div className="organization-dashboard-edit-field">
                  <label htmlFor="organization-email">Email</label>
                  <input
                    id="organization-email"
                    name="email"
                    type="email"
                    value={organizationForm.email}
                    onChange={handleOrganizationFieldChange}
                    required
                    disabled={isSavingOrganization}
                    aria-invalid={Boolean(organizationFormErrors.email)}
                    aria-describedby={
                      organizationFormErrors.email ? 'organization-email-error' : undefined
                    }
                  />
                  {organizationFormErrors.email && (
                    <p
                      id="organization-email-error"
                      className="organization-dashboard-edit-error"
                      role="alert"
                    >
                      {organizationFormErrors.email}
                    </p>
                  )}
                </div>

                <div className="organization-dashboard-edit-field">
                  <label htmlFor="organization-website">Website</label>
                  <input
                    id="organization-website"
                    name="website"
                    type="url"
                    value={organizationForm.website}
                    onChange={handleOrganizationFieldChange}
                    disabled={isSavingOrganization}
                  />
                </div>

                {organizationSaveError && (
                  <p className="organization-dashboard-edit-error" role="alert">
                    {organizationSaveError}
                  </p>
                )}

                <div className="organization-dashboard-edit-actions">
                  <button
                    type="button"
                    className="organization-dashboard-edit-cancel-button"
                    onClick={handleCancelEditingOrganization}
                    disabled={isSavingOrganization}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="organization-dashboard-edit-save-button"
                    disabled={isSavingOrganization}
                  >
                    {isSavingOrganization ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="organization-dashboard-details-header">
                  <h2>{organization.name}</h2>
                  <button
                    type="button"
                    className="organization-dashboard-edit-button"
                    aria-label="Edit organization information"
                    onClick={handleStartEditingOrganization}
                  >
                    <EditIcon aria-hidden="true" size={16} />
                  </button>
                </div>

                {organization.description && (
                  <p className="organization-dashboard-description">
                    {organization.description}
                  </p>
                )}

                <dl className="organization-dashboard-meta">
                  <div>
                    <dt>Email</dt>
                    <dd>{organization.email}</dd>
                  </div>

                  {organization.website && (
                    <div>
                      <dt>Website</dt>
                      <dd>
                        <a href={organization.website} target="_blank" rel="noreferrer">
                          {organization.website}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="organization-dashboard-opportunities" ref={opportunitiesSectionRef}>
        <div className="organization-dashboard-opportunities-header">
          <h2>My Opportunities</h2>

          <button
            type="button"
            className="organization-dashboard-create-button"
            onClick={() => navigate('/organization/opportunities/new')}
          >
            + Create New Opportunity
          </button>
        </div>

        {opportunityActionErrorMessage && (
          <p role="alert" className="organization-dashboard-close-error">
            {opportunityActionErrorMessage}
          </p>
        )}

        <OrganizationOpportunitiesTable
          opportunities={opportunities}
          isLoading={isOpportunitiesLoading}
          error={opportunitiesError}
          onCloseOpportunity={handleCloseOpportunity}
          closingOpportunityId={closingOpportunityId}
          onDeleteOpportunity={handleDeleteOpportunity}
          deletingOpportunityId={deletingOpportunityId}
        />
      </section>
    </main>
  )
}

export default OrganizationDashboardPage
