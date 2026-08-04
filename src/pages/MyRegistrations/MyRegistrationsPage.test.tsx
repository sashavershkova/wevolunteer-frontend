import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyRegistrationsPage from './MyRegistrationsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'

const MOCKED_TODAY = '2026-07-29T12:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getMyRegistrations: vi.fn(),
  cancelMyRegistration: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedCancelMyRegistration = vi.mocked(cancelMyRegistration)

function buildRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user-1',
    opportunityId: 'opp-1',
    title: 'Beach Cleanup',
    date: '2026-08-01',
    location: 'Seattle, WA',
    organizationId: 'org-1',
    organizationName: 'Green Earth',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Anna Johnson',
    email: 'anna@example.com',
    registeredAt: '2026-07-24T10:00:00',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MyRegistrationsPage />
    </MemoryRouter>,
  )
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'anna@example.com',
    userId: 'user-1',
    accessToken: 'test-token',
    userProfile: null,
    organizationProfile: null,
    isProfileLoading: false,
    isProfileInitialized: true,
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  })
}

describe('MyRegistrationsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyRegistrations.mockReset()
    mockedCancelMyRegistration.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading state while registrations are being fetched', () => {
    mockedGetMyRegistrations.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Loading registrations...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no registrations', async () => {
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('You have no registrations yet.'),
    ).toBeInTheDocument()
  })

  it('shows an error state when loading fails', async () => {
    mockedGetMyRegistrations.mockRejectedValue(
      new Error('Unable to load registrations: 500'),
    )

    renderPage()

    expect(
      await screen.findByText('Unable to load registrations: 500'),
    ).toBeInTheDocument()
  })

  it('marks a past registration as Completed and hides its Cancel Registration button', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-past', date: '2026-07-19' }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText('Registered')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancel Registration' }),
    ).not.toBeInTheDocument()
  })

  it('keeps a registration happening today as Registered and cancellable', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-today', date: '2026-07-29' }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })

  it('keeps a future registration as Registered and cancellable', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-future', date: '2026-08-01' }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })

  it('renders multiple registrations ordered newest date first', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({
        opportunityId: 'opp-old',
        title: 'Oldest Event',
        date: '2026-06-01',
      }),
      buildRegistration({
        opportunityId: 'opp-new',
        title: 'Newest Event',
        date: '2026-08-15',
      }),
      buildRegistration({
        opportunityId: 'opp-mid',
        title: 'Middle Event',
        date: '2026-07-29',
      }),
    ])

    renderPage()

    await screen.findByText('Newest Event')

    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)

    expect(titles).toEqual(['Newest Event', 'Middle Event', 'Oldest Event'])
  })

  it('does not mutate the original registrations array while sorting', async () => {
    const registrations = [
      buildRegistration({
        opportunityId: 'opp-a',
        title: 'Older Event',
        date: '2026-06-01',
      }),
      buildRegistration({
        opportunityId: 'opp-b',
        title: 'Newer Event',
        date: '2026-08-15',
      }),
    ]
    mockedGetMyRegistrations.mockResolvedValue(registrations)

    renderPage()

    await screen.findByText('Newer Event')

    expect(registrations[0].opportunityId).toBe('opp-a')
    expect(registrations[1].opportunityId).toBe('opp-b')
  })

  it('still renders the existing time display for a registration', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({
        date: '2026-08-01',
        startTime: '09:00',
        endTime: '13:00',
        time: null,
      }),
    ])

    renderPage()

    expect(await screen.findByText('9:00 AM – 1:00 PM')).toBeInTheDocument()
  })

  it('cancels an active registration and removes it from the list', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-future', date: '2999-08-01' }),
    ])
    mockedCancelMyRegistration.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    await screen.findByText('Beach Cleanup')

    await user.click(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    )

    expect(mockedCancelMyRegistration).toHaveBeenCalledWith(
      'test-token',
      'opp-future',
    )
    expect(await screen.findByText('You have no registrations yet.')).toBeInTheDocument()
  })

  it('shows an error message when cancellation fails', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-future', date: '2999-08-01' }),
    ])
    mockedCancelMyRegistration.mockRejectedValue(
      new Error('Unable to cancel registration: 500'),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    await screen.findByText('Beach Cleanup')

    await user.click(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    )

    expect(
      await screen.findByText('Unable to cancel registration: 500'),
    ).toBeInTheDocument()
  })

  it('filters the visible registrations by organization', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-a', title: 'Beach Cleanup' }),
      buildRegistration({
        opportunityId: 'opp-b',
        title: 'Food Drive',
        organizationName: 'Helping Hands',
      }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')
    expect(screen.getByText('Food Drive')).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by organization' }),
      'Green Earth',
    )

    expect(screen.getByText('Beach Cleanup')).toBeInTheDocument()
    expect(screen.queryByText('Food Drive')).not.toBeInTheDocument()
  })

  it('shows a filtered-empty message when a filter matches nothing, without showing the initial empty state', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-a', title: 'Beach Cleanup' }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')

    await user.type(
      screen.getByRole('searchbox', { name: 'Search registrations' }),
      'nonexistent',
    )

    expect(
      screen.getByText(
        'No registrations match your search yet. Try adjusting your filters.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('You have no registrations yet.'),
    ).not.toBeInTheDocument()
  })

  it('links each registration card to its opportunity detail route', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp-future', date: '2999-08-01' }),
    ])

    renderPage()

    await screen.findByText('Beach Cleanup')

    expect(
      screen.getByRole('link', { name: 'View details for Beach Cleanup' }),
    ).toHaveAttribute('href', '/opportunities/opp-future')
  })
})
