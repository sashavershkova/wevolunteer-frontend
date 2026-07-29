import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OpportunityDetailsPage from './OpportunityDetailsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity, registerForOpportunity } from '../../services/api/opportunityService'
import { getOrganization } from '../../services/api/organizationService'
import { getMyRegistrations, cancelMyRegistration } from '../../services/api/registrationService'
import { opp1, opp2 } from '../../tests/fixtures/opportunities'

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

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunity = vi.mocked(getOpportunity)
const mockedRegisterForOpportunity = vi.mocked(registerForOpportunity)
const mockedGetOrganization = vi.mocked(getOrganization)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedCancelMyRegistration = vi.mocked(cancelMyRegistration)

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
    expect(screen.getByText(opp1.time as string)).toBeInTheDocument()
  })

  it('omits the time row when the opportunity has no time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp2)
    mockedGetOrganization.mockResolvedValue(organizationFixture)
    mockedGetMyRegistrations.mockResolvedValue([])

    renderPage()

    await screen.findByRole('heading', { name: opp2.title })

    expect(screen.queryByText('Time')).not.toBeInTheDocument()
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
    expect(mockedGetMyRegistrations).not.toHaveBeenCalled()
  })
})
