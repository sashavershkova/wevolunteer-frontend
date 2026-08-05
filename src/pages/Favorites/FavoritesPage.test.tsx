import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FavoritesPage from './FavoritesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getOpportunities,
  getOpportunity,
  registerForOpportunity,
} from '../../services/api/opportunityService'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import {
  getMyFavorites,
  removeFavorite,
  type Favorite,
} from '../../services/api/favoriteService'
import {
  getMyWaitlist,
  joinWaitlist,
  leaveWaitlist,
  type Waitlist,
} from '../../services/api/waitlistService'
import { opp1, opp2, opp3 } from '../../tests/fixtures/opportunities'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunities: vi.fn(),
  getOpportunity: vi.fn(),
  registerForOpportunity: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getMyRegistrations: vi.fn(),
  cancelMyRegistration: vi.fn(),
}))

vi.mock('../../services/api/favoriteService', () => ({
  getMyFavorites: vi.fn(),
  removeFavorite: vi.fn(),
}))

vi.mock('../../services/api/waitlistService', () => ({
  getMyWaitlist: vi.fn(),
  joinWaitlist: vi.fn(),
  leaveWaitlist: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunities = vi.mocked(getOpportunities)
const mockedGetOpportunity = vi.mocked(getOpportunity)
const mockedRegisterForOpportunity = vi.mocked(registerForOpportunity)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedCancelMyRegistration = vi.mocked(cancelMyRegistration)
const mockedGetMyFavorites = vi.mocked(getMyFavorites)
const mockedRemoveFavorite = vi.mocked(removeFavorite)
const mockedGetMyWaitlist = vi.mocked(getMyWaitlist)
const mockedJoinWaitlist = vi.mocked(joinWaitlist)
const mockedLeaveWaitlist = vi.mocked(leaveWaitlist)

function buildRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user1',
    opportunityId: 'opp1',
    title: opp1.title,
    date: opp1.date,
    location: opp1.location,
    organizationId: opp1.organizationId,
    organizationName: opp1.organizationName,
    registrationStatus: 'REGISTERED',
    volunteerName: 'Sasha Vershkova',
    email: 'sasha@example.com',
    registeredAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function buildFavorite(overrides: Partial<Favorite>): Favorite {
  return {
    userId: 'user1',
    opportunityId: 'opp1',
    title: opp1.title,
    date: opp1.date,
    location: opp1.location,
    organizationId: opp1.organizationId,
    organizationName: opp1.organizationName,
    favoritedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function buildWaitlistEntry(overrides: Partial<Waitlist>): Waitlist {
  return {
    userId: 'user1',
    opportunityId: 'opp2',
    title: opp2.title,
    date: opp2.date,
    location: opp2.location,
    organizationId: opp2.organizationId,
    organizationName: opp2.organizationName,
    volunteerName: 'Sasha Vershkova',
    email: 'sasha@example.com',
    joinedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'sasha@example.com',
    userId: 'user1',
    accessToken: 'token',
    userProfile: {
      userId: 'user1',
      name: 'Sasha Vershkova',
      email: 'sasha@example.com',
      role: 'VOLUNTEER',
      profileImageUrl: null,
    },
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

function renderPage() {
  return render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>,
  )
}

// Before every existing fixture date (opp1/opp2/opp3 are all in July 2026) so
// adding expiration handling doesn't change the outcome of tests that don't
// care about it, regardless of when this suite actually runs.
const MOCKED_TODAY = '2026-07-01T12:00:00'

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetOpportunities.mockReset()
    mockedRegisterForOpportunity.mockReset()
    mockedGetMyRegistrations.mockReset().mockResolvedValue([])
    mockedCancelMyRegistration.mockReset()
    mockedGetMyFavorites.mockReset()
    mockedRemoveFavorite.mockReset()
    mockedGetMyWaitlist.mockReset().mockResolvedValue([])
    mockedJoinWaitlist.mockReset()
    mockedLeaveWaitlist.mockReset()
    mockedGetOpportunity.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows only opportunities that are favorited', async () => {
    mockedGetOpportunities.mockResolvedValue([opp1, opp2, opp3])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(
      screen.queryByRole('heading', { name: 'Community Meal Prep' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Park Cleanup Day' }),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no favorites', async () => {
    mockedGetOpportunities.mockResolvedValue([opp1, opp2, opp3])
    mockedGetMyFavorites.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('You have no saved opportunities yet.'),
    ).toBeInTheDocument()
  })

  it('shows an error message when loading fails', async () => {
    mockedGetOpportunities.mockRejectedValue(new Error('Network error'))
    mockedGetMyFavorites.mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to load favorites. Please try again later.',
      )
    })
  })

  it('shows a filter bar scoped to the favorited opportunities', async () => {
    mockedGetOpportunities.mockResolvedValue([opp1, opp2, opp3])
    mockedGetMyFavorites.mockResolvedValue([
      buildFavorite({ opportunityId: 'opp1' }),
      buildFavorite({ opportunityId: 'opp3', title: opp3.title }),
    ])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    const user = userEvent.setup()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by category' }),
      'Environment',
    )

    expect(
      screen.queryByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Park Cleanup Day' }),
    ).toBeInTheDocument()
  })

  it('registers for a favorited opportunity, keeps it in the list, and shows the Registered state', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
    mockedRegisterForOpportunity.mockResolvedValue(undefined)

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(mockedRegisterForOpportunity).toHaveBeenCalledWith('token', 'user1', 'opp1')
    await waitFor(() => {
      expect(screen.getByText('Registered')).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
  })

  it('shows the Registered state on load for an opportunity the volunteer already registered for', async () => {
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp1' }),
    ])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })

  it('cancels a registration and shows the Register button again', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
    mockedGetMyRegistrations.mockResolvedValue([
      buildRegistration({ opportunityId: 'opp1' }),
    ])
    mockedCancelMyRegistration.mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    await screen.findByRole('button', { name: 'Cancel Registration' })

    await user.click(screen.getByRole('button', { name: 'Cancel Registration' }))

    expect(mockedCancelMyRegistration).toHaveBeenCalledWith('token', 'opp1')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    })
  })

  it('removes an opportunity from the list when its heart is clicked', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
    mockedRemoveFavorite.mockResolvedValue(undefined)

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    await user.click(screen.getByRole('button', { name: 'Remove from favorites' }))

    expect(mockedRemoveFavorite).toHaveBeenCalledWith('token', 'opp1')
    expect(
      await screen.findByText('You have no saved opportunities yet.'),
    ).toBeInTheDocument()
  })

  it('shows a Waitlisted badge for a favorited, full opportunity that is already waitlisted', async () => {
    mockedGetOpportunities.mockResolvedValue([opp2])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])
    mockedGetMyWaitlist.mockResolvedValue([buildWaitlistEntry({})])

    renderPage()

    await screen.findByRole('heading', { name: 'Community Meal Prep' })

    expect(screen.getByText('Waitlisted')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Leave Waitlist' }),
    ).toBeInTheDocument()
  })

  it('joins the waitlist for a favorited, full opportunity when Join Waitlist is clicked', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp2])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])
    mockedJoinWaitlist.mockResolvedValue(buildWaitlistEntry({}))

    renderPage()

    await screen.findByRole('heading', { name: 'Community Meal Prep' })

    await user.click(screen.getByRole('button', { name: 'Join Waitlist' }))

    expect(mockedJoinWaitlist).toHaveBeenCalledWith('token', 'opp2')
    expect(
      await screen.findByRole('button', { name: 'Leave Waitlist' }),
    ).toBeInTheDocument()
  })

  it('leaves the waitlist when Leave Waitlist is clicked, staying on Join Waitlist while still full', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp2])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])
    mockedGetMyWaitlist.mockResolvedValue([buildWaitlistEntry({})])
    mockedLeaveWaitlist.mockResolvedValue(undefined)
    mockedGetOpportunity.mockResolvedValue(opp2)

    renderPage()

    await screen.findByRole('button', { name: 'Leave Waitlist' })

    await user.click(screen.getByRole('button', { name: 'Leave Waitlist' }))

    expect(mockedLeaveWaitlist).toHaveBeenCalledWith('token', 'opp2')
    expect(
      await screen.findByRole('button', { name: 'Join Waitlist' }),
    ).toBeInTheDocument()
  })

  it('shows a Register button after leaving the waitlist if a spot opened up in the meantime', async () => {
    const user = userEvent.setup()
    mockedGetOpportunities.mockResolvedValue([opp2])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])
    mockedGetMyWaitlist.mockResolvedValue([buildWaitlistEntry({})])
    mockedLeaveWaitlist.mockResolvedValue(undefined)
    mockedGetOpportunity.mockResolvedValue({
      ...opp2,
      registeredCount: opp2.registeredCount - 1,
      availableSpots: 1,
    })

    renderPage()

    await screen.findByRole('button', { name: 'Leave Waitlist' })

    await user.click(screen.getByRole('button', { name: 'Leave Waitlist' }))

    expect(mockedGetOpportunity).toHaveBeenCalledWith('token', 'opp2')
    expect(await screen.findByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
    expect(screen.queryByText('Waitlisted')).not.toBeInTheDocument()
  })

  describe('expired favorites', () => {
    const expiredOpen = { ...opp1, date: '2026-06-30' }
    const expiredFull = { ...opp2, date: '2026-06-30' }

    it('keeps an expired favorite visible in the list', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])

      renderPage()

      expect(
        await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' }),
      ).toBeInTheDocument()
    })

    it('shows a Completed status for an expired favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])

      renderPage()

      expect(await screen.findByText('Completed')).toBeInTheDocument()
    })

    it('does not show a Register button for an expired favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])

      renderPage()

      await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

      expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
    })

    it('does not show a Join Waitlist button for an expired, full favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredFull])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])

      renderPage()

      await screen.findByRole('heading', { name: 'Community Meal Prep' })

      expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
    })

    it('does not call registerForOpportunity for an expired favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])

      renderPage()

      await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

      expect(mockedRegisterForOpportunity).not.toHaveBeenCalled()
    })

    it('does not call joinWaitlist for an expired, full favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredFull])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])

      renderPage()

      await screen.findByRole('heading', { name: 'Community Meal Prep' })

      expect(mockedJoinWaitlist).not.toHaveBeenCalled()
    })

    it('still removes an expired favorite when its heart is clicked', async () => {
      const user = userEvent.setup()
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
      mockedRemoveFavorite.mockResolvedValue(undefined)

      renderPage()

      await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

      await user.click(screen.getByRole('button', { name: 'Remove from favorites' }))

      expect(mockedRemoveFavorite).toHaveBeenCalledWith('token', 'opp1')
      expect(
        await screen.findByText('You have no saved opportunities yet.'),
      ).toBeInTheDocument()
    })

    it('preserves the Registered state for an already-registered expired favorite', async () => {
      mockedGetOpportunities.mockResolvedValue([expiredOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
      mockedGetMyRegistrations.mockResolvedValue([
        buildRegistration({ opportunityId: 'opp1' }),
      ])

      renderPage()

      await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

      expect(screen.getByText('Registered')).toBeInTheDocument()
      expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    })

    it('preserves normal Register behavior for a favorite dated today', async () => {
      const user = userEvent.setup()
      const todayOpen = { ...opp1, date: '2026-07-01' }
      mockedGetOpportunities.mockResolvedValue([todayOpen])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp1' })])
      mockedRegisterForOpportunity.mockResolvedValue(undefined)

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Register' }))

      expect(mockedRegisterForOpportunity).toHaveBeenCalledWith('token', 'user1', 'opp1')
    })

    it('preserves normal Join Waitlist behavior for a future, full favorite', async () => {
      const user = userEvent.setup()
      const futureFull = { ...opp2, date: '2026-07-02' }
      mockedGetOpportunities.mockResolvedValue([futureFull])
      mockedGetMyFavorites.mockResolvedValue([buildFavorite({ opportunityId: 'opp2' })])
      mockedJoinWaitlist.mockResolvedValue(buildWaitlistEntry({}))

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Join Waitlist' }))

      expect(mockedJoinWaitlist).toHaveBeenCalledWith('token', 'opp2')
    })
  })
})
