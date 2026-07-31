import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import OnboardingPage from '../Onboarding/OnboardingPage'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import { isPastOpportunityDate } from '../../utils/isPastOpportunityDate'
import { calculateHoursContributed } from '../../utils/calculateHoursContributed'
import MetricCard from '../../components/shared/MetricCard/MetricCard'
import { DateIcon, CompletedIcon, TimeIcon } from '../../components/shared/icons'
import UpcomingRegistrationList from '../../components/dashboard/UpcomingRegistrationList/UpcomingRegistrationList'
import './DashboardPage.css'

const MAX_UPCOMING = 3

function DashboardPage() {
  const auth = useAppAuth()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(auth.accessToken))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cancellingOpportunityId, setCancellingOpportunityId] =
    useState<string | null>(null)
  const [cancellationErrorMessage, setCancellationErrorMessage] =
    useState<string | null>(null)

  useEffect(() => {
    if (!auth.accessToken) {
      return
    }

    let ignore = false

    const loadRegistrations = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const result = await getMyRegistrations(auth.accessToken)

        if (!ignore) {
          setRegistrations(result)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your dashboard.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadRegistrations()

    return () => {
      ignore = true
    }
  }, [auth.accessToken])

  const handleCancelRegistration = async (opportunityId: string) => {
    if (!auth.accessToken) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this registration?',
    )

    if (!confirmed) {
      return
    }

    setCancellationErrorMessage(null)
    setCancellingOpportunityId(opportunityId)

    try {
      await cancelMyRegistration(auth.accessToken, opportunityId)

      setRegistrations((current) =>
        current.filter(
          (registration) => registration.opportunityId !== opportunityId,
        ),
      )
    } catch (error) {
      setCancellationErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to cancel registration',
      )
    } finally {
      setCancellingOpportunityId(null)
    }
  }

  if (auth.isProfileLoading) {
    return (
      <main className="dashboard-page">
        <h1>Loading your profile...</h1>
      </main>
    )
  }

  if (auth.profileErrorMessage) {
    return (
      <main className="dashboard-page">
        <h1>Unable to load your profile</h1>
        <p>{auth.profileErrorMessage}</p>
      </main>
    )
  }

  if (auth.organizationProfile !== null) {
    return <Navigate to="/organization" replace />
  }

  if (auth.userProfile === null) {
    return <OnboardingPage />
  }

  const showMetricsPlaceholder = isLoading || errorMessage !== null

  const completedCount = registrations.filter((registration) =>
    isPastOpportunityDate(registration.date),
  ).length
  const upcomingCount = registrations.length - completedCount
  const hoursContributed = calculateHoursContributed(registrations)

  function formatMetric(value: string | number): string {
    return showMetricsPlaceholder ? '—' : String(value)
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome back, {auth.userProfile.name}</h1>
        <p className="dashboard-subtitle">
          Here&rsquo;s an overview of your volunteer journey.
        </p>
      </header>

      <section
        className="dashboard-metrics"
        aria-label="Volunteer activity metrics"
        aria-live="polite"
      >
        <MetricCard
          icon={DateIcon}
          label="Upcoming Opportunities"
          value={formatMetric(upcomingCount)}
          hint="Registered and coming up"
        />
        <MetricCard
          icon={CompletedIcon}
          label="Completed Opportunities"
          value={formatMetric(completedCount)}
          hint="Opportunity date has passed"
        />
        <MetricCard
          icon={TimeIcon}
          label="Hours Contributed"
          value={formatMetric(hoursContributed)}
          hint="From completed opportunities"
        />
      </section>

      <section className="dashboard-upcoming" aria-label="Upcoming Opportunities">
        <div className="dashboard-section-header">
          <h2>Upcoming Opportunities</h2>
          <Link to="/my-registrations" className="dashboard-view-all-link">
            View all registrations
          </Link>
        </div>

        {cancellationErrorMessage && (
          <p role="alert" className="dashboard-cancellation-error">
            {cancellationErrorMessage}
          </p>
        )}

        <UpcomingRegistrationList
          registrations={registrations}
          isLoading={isLoading}
          error={errorMessage}
          maxItems={MAX_UPCOMING}
          onCancel={handleCancelRegistration}
          cancellingOpportunityId={cancellingOpportunityId}
        />
      </section>
    </main>
  )
}

export default DashboardPage