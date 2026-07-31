import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  cancelMyRegistration,
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'

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

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>>) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'coco@example.com',
    userId: 'user1',
    accessToken: 'token',
    userProfile: {
      userId: 'user1',
      name: 'Coco Chocolate',
      email: 'coco@example.com',
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

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user1',
    opportunityId: 'opp1',
    title: 'Opportunity',
    date: '2026-08-10',
    location: 'Seattle, WA',
    organizationId: 'org1',
    organizationName: 'Org',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Coco Chocolate',
    email: 'coco@example.com',
    registeredAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
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
  })

  it('shows onboarding when the volunteer has no profile yet', () => {
    mockAuth({ userProfile: null })

    renderPage()

    expect(
      screen.queryByText(/Welcome back/),
    ).not.toBeInTheDocument()
  })

  it('computes and displays upcoming, completed, and hours contributed metrics', async () => {
    mockAuth({})
    mockedGetMyRegistrations.mockResolvedValue([
      makeRegistration({
        opportunityId: 'past1',
        date: '2020-01-01',
        startTime: '09:00',
        endTime: '13:00',
      }),
      makeRegistration({ opportunityId: 'future1', date: '2026-09-01' }),
    ])

    renderPage()

    await screen.findByText('Welcome back, Coco Chocolate')

    expect(
      screen.getByRole('heading', { name: 'Upcoming Opportunities' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Upcoming Opportunities')).toHaveLength(2)
    expect(screen.getByText('Completed Opportunities')).toBeInTheDocument()
    expect(screen.getByText('Hours Contributed')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
  })

  it('shows an error message when loading registrations fails', async () => {
    mockAuth({})
    mockedGetMyRegistrations.mockRejectedValue(new Error('Network error'))

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Network error',
      )
    })
  })

  it('removes a registration from the upcoming list once cancellation succeeds', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockAuth({})
    mockedGetMyRegistrations.mockResolvedValue([
      makeRegistration({ opportunityId: 'opp1', title: 'Food Bank Shift', date: '2026-09-01' }),
    ])
    mockedCancelMyRegistration.mockResolvedValue(undefined)

    renderPage()

    await screen.findByText('Food Bank Shift')

    await user.click(screen.getByRole('button', { name: 'Cancel registration' }))

    await waitFor(() => {
      expect(screen.queryByText('Food Bank Shift')).not.toBeInTheDocument()
    })
    expect(mockedCancelMyRegistration).toHaveBeenCalledWith('token', 'opp1')

    confirmSpy.mockRestore()
  })

  it('does not cancel when the confirmation dialog is declined', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockAuth({})
    mockedGetMyRegistrations.mockResolvedValue([
      makeRegistration({ opportunityId: 'opp1', title: 'Food Bank Shift', date: '2026-09-01' }),
    ])

    renderPage()

    await screen.findByText('Food Bank Shift')

    await user.click(screen.getByRole('button', { name: 'Cancel registration' }))

    expect(mockedCancelMyRegistration).not.toHaveBeenCalled()
    expect(screen.getByText('Food Bank Shift')).toBeInTheDocument()

    confirmSpy.mockRestore()
  })
})