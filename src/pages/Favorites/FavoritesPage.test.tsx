import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FavoritesPage from './FavoritesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
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
import { opp1, opp2, opp3 } from '../../tests/fixtures/opportunities'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunities: vi.fn(),
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

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunities = vi.mocked(getOpportunities)
const mockedRegisterForOpportunity = vi.mocked(registerForOpportunity)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedCancelMyRegistration = vi.mocked(cancelMyRegistration)
const mockedGetMyFavorites = vi.mocked(getMyFavorites)
const mockedRemoveFavorite = vi.mocked(removeFavorite)

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

describe('FavoritesPage', () => {
  beforeEach(() => {
    mockedGetOpportunities.mockReset()
    mockedRegisterForOpportunity.mockReset()
    mockedGetMyRegistrations.mockReset().mockResolvedValue([])
    mockedCancelMyRegistration.mockReset()
    mockedGetMyFavorites.mockReset()
    mockedRemoveFavorite.mockReset()
    mockAuth()
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
})
