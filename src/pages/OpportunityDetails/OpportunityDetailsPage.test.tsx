import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OpportunityDetailsPage from './OpportunityDetailsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity, registerForOpportunity } from '../../services/api/opportunityService'
import { getOrganization } from '../../services/api/organizationService'
import { getMyRegistrations, cancelMyRegistration } from '../../services/api/registrationService'
import { getMyFavorites, removeFavorite, saveFavorite } from '../../services/api/favoriteService'
import { opp1, opp2, opp3, opp7 } from '../../tests/fixtures/opportunities'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunity: vi.fn(),
  registerForOpportunity: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getOrganization: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getMyRegistrations: vi.fn(),
  cancelMyRegistration: vi.fn(),
}))

vi.mock('../../services/api/favoriteService', () => ({
  getMyFavorites: vi.fn(),
  saveFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunity = vi.mocked(getOpportunity)
const mockedRegisterForOpportunity = vi.mocked(registerForOpportunity)
const mockedGetOrganization = vi.mocked(getOrganization)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedCancelMyRegistration = vi.mocked(cancelMyRegistration)
const mockedGetMyFavorites = vi.mocked(getMyFavorites)
const mockedSaveFavorite = vi.mocked(saveFavorite)
const mockedRemoveFavorite = vi.mocked(removeFavorite)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: 'https://seattlefoodbank.example',
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
    },
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
    <MemoryRouter initialEntries={['/opportunities/opp1']}>
      <Routes>
        <Route path="/opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OpportunityDetailsPage', () => {
  beforeEach(() => {
    mockedGetOpportunity.mockReset()
    mockedRegisterForOpportunity.mockReset()
    mockedGetOrganization.mockReset()
    mockedGetMyRegistrations.mockReset()
    mockedCancelMyRegistration.mockReset()
    mockedGetMyFavorites.mockReset()
    mockedSaveFavorite.mockReset()
    mockedRemoveFavorite.mockReset()
    // Default to no saved favorites; individual tests override before
    // renderPage() when they need to exercise the "already saved" state.
    mockedGetMyFavorites.mockResolvedValue([])
    mockAuth({})
  })

  it('shows a loading state before data arrives', () => {
    mockedGetOpportunity.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading opportunity...')
  })

  it('shows opportunity and organization details once loaded, with a Register button', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Seattle Food Bank')).toBeInTheDocument()
    expect(screen.getByText('We distribute food to local families.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('shows the time row when the opportunity has a time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument()
  })

  it('omits the time row when the opportunity has no time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp2)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp2.title })

    expect(screen.queryByText('Time')).not.toBeInTheDocument()
  })

  it('shows the legacy time unchanged for an opportunity with only legacy time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp7)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp7.title })

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
  })

  it('shows the What You\'ll Do checklist when the opportunity has one', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(screen.getByRole('heading', { name: "What You'll Do" })).toBeInTheDocument()
    for (const task of opp1.whatYoullDo) {
      expect(screen.getByText(task)).toBeInTheDocument()
    }
  })

  it('omits the What You\'ll Do section when the checklist is empty', async () => {
    mockedGetOpportunity.mockResolvedValue(opp2)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp2.title })

    expect(screen.queryByRole('heading', { name: "What You'll Do" })).not.toBeInTheDocument()
  })

  it('shows an Ongoing badge for a recurring opportunity', async () => {
    mockedGetOpportunity.mockResolvedValue(opp3)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp3.title })

    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('omits the Ongoing badge for a one-time opportunity', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp1.title })

    expect(screen.queryByText('Ongoing')).not.toBeInTheDocument()
  })

  it('shows a not-found message when the opportunity does not exist', async () => {
    mockedGetOpportunity.mockResolvedValue(null)

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be found')
  })

  it('shows Cancel registration when the volunteer is already registered', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([
      {
        userId: 'user1',
        opportunityId: 'opp1',
        title: opp1.title,
        date: opp1.date,
        location: opp1.location,
        organizationId: opp1.organizationId,
        organizationName: opp1.organizationName,
        registrationStatus: 'ACTIVE',
        volunteerName: 'Sasha Vershkova',
        email: 'sasha@example.com',
        registeredAt: '2026-07-01T00:00:00',
      },
    ])

    renderPage()

    expect(await screen.findByRole('button', { name: 'Cancel registration' })).toBeInTheDocument()
    expect(screen.getByText("You're registered")).toBeInTheDocument()
  })

  it('registers when the volunteer clicks Register', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedRegisterForOpportunity.mockResolvedValue(undefined)

    renderPage()

    const registerButton = await screen.findByRole('button', { name: 'Register' })
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(mockedRegisterForOpportunity).toHaveBeenCalledWith('token', 'user1', 'opp1')
    })
    expect(await screen.findByRole('button', { name: 'Cancel registration' })).toBeInTheDocument()
  })

  it('cancels the registration when the volunteer confirms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([
      {
        userId: 'user1',
        opportunityId: 'opp1',
        title: opp1.title,
        date: opp1.date,
        location: opp1.location,
        organizationId: opp1.organizationId,
        organizationName: opp1.organizationName,
        registrationStatus: 'ACTIVE',
        volunteerName: 'Sasha Vershkova',
        email: 'sasha@example.com',
        registeredAt: '2026-07-01T00:00:00',
      },
    ])
    mockedCancelMyRegistration.mockResolvedValue(undefined)

    renderPage()

    const cancelButton = await screen.findByRole('button', { name: 'Cancel registration' })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockedCancelMyRegistration).toHaveBeenCalledWith('token', 'opp1')
    })
    expect(await screen.findByRole('button', { name: 'Register' })).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('hides the register/cancel action area for an organization profile', async () => {
    mockAuth({
      userProfile: null,
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: '',
        email: '',
        website: '',
      },
    })
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)

    renderPage()

    await screen.findByRole('heading', { name: 'Food Bank Volunteer Shift' })

    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    expect(mockedGetMyRegistrations).not.toHaveBeenCalled()
    expect(mockedGetMyFavorites).not.toHaveBeenCalled()
  })

  it('shows an unpressed Save button when the opportunity is not yet favorited', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    const saveButton = await screen.findByRole('button', { name: 'Save' })
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('saves the opportunity when the volunteer clicks Save', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedSaveFavorite.mockResolvedValue({
      userId: 'user1',
      opportunityId: 'opp1',
      title: opp1.title,
      date: opp1.date,
      location: opp1.location,
      organizationId: opp1.organizationId,
      organizationName: opp1.organizationName,
      favoritedAt: '2026-07-29T00:00:00',
    })

    renderPage()

    const saveButton = await screen.findByRole('button', { name: 'Save' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockedSaveFavorite).toHaveBeenCalledWith('token', 'opp1')
    })
    expect(await screen.findByRole('button', { name: 'Saved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows a pressed Saved button when the opportunity is already favorited', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedGetMyFavorites.mockResolvedValue([
      {
        userId: 'user1',
        opportunityId: 'opp1',
        title: opp1.title,
        date: opp1.date,
        location: opp1.location,
        organizationId: opp1.organizationId,
        organizationName: opp1.organizationName,
        favoritedAt: '2026-07-01T00:00:00',
      },
    ])

    renderPage()

    const saveButton = await screen.findByRole('button', { name: 'Saved' })
    expect(saveButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('removes the favorite when the volunteer clicks Saved', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedGetMyFavorites.mockResolvedValue([
      {
        userId: 'user1',
        opportunityId: 'opp1',
        title: opp1.title,
        date: opp1.date,
        location: opp1.location,
        organizationId: opp1.organizationId,
        organizationName: opp1.organizationName,
        favoritedAt: '2026-07-01T00:00:00',
      },
    ])
    mockedRemoveFavorite.mockResolvedValue(undefined)

    renderPage()

    const savedButton = await screen.findByRole('button', { name: 'Saved' })
    fireEvent.click(savedButton)

    await waitFor(() => {
      expect(mockedRemoveFavorite).toHaveBeenCalledWith('token', 'opp1')
    })
    expect(await screen.findByRole('button', { name: 'Save' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
