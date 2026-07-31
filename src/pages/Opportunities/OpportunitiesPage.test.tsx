import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OpportunitiesPage from './OpportunitiesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunities, registerForOpportunity } from '../../services/api/opportunityService'
import { getMyRegistrations, type Registration } from '../../services/api/registrationService'
import {
  getMyFavorites,
  removeFavorite,
  saveFavorite,
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
}))

vi.mock('../../services/api/favoriteService', () => ({
  getMyFavorites: vi.fn(),
  saveFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunities = vi.mocked(getOpportunities)
const mockedRegisterForOpportunity = vi.mocked(registerForOpportunity)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedGetMyFavorites = vi.mocked(getMyFavorites)
const mockedSaveFavorite = vi.mocked(saveFavorite)
const mockedRemoveFavorite = vi.mocked(removeFavorite)

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

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>>) {
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
      <OpportunitiesPage />
    </MemoryRouter>,
  )
}

describe('OpportunitiesPage', () => {
  beforeEach(() => {
    mockedGetMyFavorites.mockReset().mockResolvedValue([])
    mockedSaveFavorite.mockReset()
    mockedRemoveFavorite.mockReset()
  })

  it('shows a loading message while the profile is loading', () => {
    mockAuth({ isProfileLoading: true })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Loading your profile...' }),
    ).toBeInTheDocument()
  })

  it('shows an error message when the profile fails to load', () => {
    mockAuth({ profileErrorMessage: 'Something went wrong.' })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Unable to load your profile' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  it('shows onboarding when the volunteer has no profile yet', () => {
    mockAuth({ userProfile: null })

    renderPage()

    expect(
      screen.queryByRole('heading', { name: 'Browse Opportunities' }),
    ).not.toBeInTheDocument()
  })

  it('loads opportunities and hides ones the volunteer already registered for', async () => {
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1, opp2, opp3])
    mockedGetMyRegistrations.mockResolvedValue([
      {
        userId: 'user1',
        opportunityId: 'opp2',
        title: opp2.title,
        date: opp2.date,
        location: opp2.location,
        organizationId: opp2.organizationId,
        organizationName: opp2.organizationName,
        registrationStatus: 'REGISTERED',
        volunteerName: 'Sasha Vershkova',
        email: 'sasha@example.com',
        registeredAt: '2026-07-01T00:00:00Z',
      } satisfies Registration,
    ])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(
      screen.queryByRole('heading', { name: 'Community Meal Prep' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Park Cleanup Day' }),
    ).toBeInTheDocument()
  })

  it('shows an error message when loading opportunities fails', async () => {
    mockAuth({})
    mockedGetOpportunities.mockRejectedValue(new Error('Network error'))
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to load opportunities. Please try again later.',
      )
    })
  })

  it('removes an opportunity from the list once registration succeeds', async () => {
    const user = userEvent.setup()
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedRegisterForOpportunity.mockResolvedValue(undefined)

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Food Bank Volunteer Shift' }),
      ).not.toBeInTheDocument()
    })
    expect(mockedRegisterForOpportunity).toHaveBeenCalledWith(
      'token',
      'user1',
      'opp1',
    )
  })

  it('filters the visible list when a category is selected', async () => {
    const user = userEvent.setup()
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

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

  it('shows a filled heart for an opportunity that is already favorited', async () => {
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({})])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(
      screen.getByRole('button', { name: 'Remove from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('saves an opportunity as a favorite when its heart is clicked', async () => {
    const user = userEvent.setup()
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedSaveFavorite.mockResolvedValue(buildFavorite({}))

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }))

    expect(mockedSaveFavorite).toHaveBeenCalledWith('token', 'opp1')
    expect(
      await screen.findByRole('button', { name: 'Remove from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('removes an opportunity from favorites when a filled heart is clicked', async () => {
    const user = userEvent.setup()
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1])
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({})])
    mockedRemoveFavorite.mockResolvedValue(undefined)

    renderPage()

    await screen.findByRole('button', { name: 'Remove from favorites' })

    await user.click(screen.getByRole('button', { name: 'Remove from favorites' }))

    expect(mockedRemoveFavorite).toHaveBeenCalledWith('token', 'opp1')
    expect(
      await screen.findByRole('button', { name: 'Save to favorites' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps a favorite heart correct after filtering the visible list', async () => {
    const user = userEvent.setup()
    mockAuth({})
    mockedGetOpportunities.mockResolvedValue([opp1, opp3])
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedGetMyFavorites.mockResolvedValue([
      buildFavorite({ opportunityId: opp3.opportunityId, title: opp3.title }),
    ])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by category' }),
      'Environment',
    )

    await screen.findByRole('heading', { name: 'Park Cleanup Day' })

    expect(
      screen.getByRole('button', { name: 'Remove from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})