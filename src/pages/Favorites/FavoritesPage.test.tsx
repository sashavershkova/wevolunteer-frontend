import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FavoritesPage from './FavoritesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyFavorites,
  removeFavorite,
  type Favorite,
} from '../../services/api/favoriteService'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/favoriteService', () => ({
  getMyFavorites: vi.fn(),
  removeFavorite: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyFavorites = vi.mocked(getMyFavorites)
const mockedRemoveFavorite = vi.mocked(removeFavorite)

function buildFavorite(overrides: Partial<Favorite>): Favorite {
  return {
    userId: 'user-1',
    opportunityId: 'opp-1',
    title: 'Beach Cleanup',
    date: '2026-08-01',
    location: 'Seattle, WA',
    organizationId: 'org-1',
    organizationName: 'Green Earth',
    favoritedAt: '2026-07-24T10:00:00',
    ...overrides,
  }
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
    mockedGetMyFavorites.mockReset()
    mockedRemoveFavorite.mockReset()
    mockAuth()
  })

  it('shows a loading state while favorites are being fetched', () => {
    mockedGetMyFavorites.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Loading favorites...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no favorites', async () => {
    mockedGetMyFavorites.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('You have no saved opportunities yet.'),
    ).toBeInTheDocument()
  })

  it('shows an error state when loading fails', async () => {
    mockedGetMyFavorites.mockRejectedValue(new Error('Unable to load favorites: 500'))

    renderPage()

    expect(await screen.findByText('Unable to load favorites: 500')).toBeInTheDocument()
  })

  it('renders multiple favorites ordered most recently saved first', async () => {
    mockedGetMyFavorites.mockResolvedValue([
      buildFavorite({
        opportunityId: 'opp-old',
        title: 'Oldest Save',
        favoritedAt: '2026-07-01T00:00:00',
      }),
      buildFavorite({
        opportunityId: 'opp-new',
        title: 'Newest Save',
        favoritedAt: '2026-07-24T00:00:00',
      }),
    ])

    renderPage()

    await screen.findByText('Newest Save')

    const titles = screen.getAllByRole('link').map((link) => link.textContent)

    expect(titles).toEqual(['Newest Save', 'Oldest Save'])
  })

  it('removes a favorite from the list when its remove button is clicked', async () => {
    const user = userEvent.setup()
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({})])
    mockedRemoveFavorite.mockResolvedValue(undefined)

    renderPage()

    await screen.findByText('Beach Cleanup')

    await user.click(
      screen.getByRole('button', { name: 'Remove Beach Cleanup from favorites' }),
    )

    expect(mockedRemoveFavorite).toHaveBeenCalledWith('test-token', 'opp-1')
    expect(
      await screen.findByText('You have no saved opportunities yet.'),
    ).toBeInTheDocument()
  })

  it('shows an error message when removing a favorite fails', async () => {
    const user = userEvent.setup()
    mockedGetMyFavorites.mockResolvedValue([buildFavorite({})])
    mockedRemoveFavorite.mockRejectedValue(new Error('Unable to remove favorite: 500'))

    renderPage()

    await screen.findByText('Beach Cleanup')

    await user.click(
      screen.getByRole('button', { name: 'Remove Beach Cleanup from favorites' }),
    )

    expect(
      await screen.findByText('Unable to remove favorite: 500'),
    ).toBeInTheDocument()
  })
})
