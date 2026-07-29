import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationDashboardPage from './OrganizationDashboardPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { closeOpportunity } from '../../services/api/opportunityService'
import { opp1 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  closeOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedCloseOpportunity = vi.mocked(closeOpportunity)

const organizationFixture = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: '',
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'org@example.com',
    userId: 'org1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: organizationFixture,
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
    <MemoryRouter initialEntries={['/organization']}>
      <Routes>
        <Route path="/organization" element={<OrganizationDashboardPage />} />
        <Route
          path="/organization/opportunities/new"
          element={<div>Create Opportunity Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

function getMetricValue(label: string): string {
  const card = screen.getByText(label).closest('.organization-dashboard-metric-card')
  return within(card as HTMLElement).getByText(/^(—|\d+)$/).textContent ?? ''
}

describe('OrganizationDashboardPage', () => {
  beforeEach(() => {
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedCloseOpportunity.mockReset()
    mockAuth()
  })

  it('loads organization opportunities using the existing service', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledWith('token')
  })

  it('closes an opportunity, updates state and metrics locally, and does not refetch', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    const closedOpportunity: Opportunity = { ...opp1, status: 'CLOSED' }
    mockedCloseOpportunity.mockResolvedValue(closedOpportunity)

    renderPage()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()
    expect(getMetricValue('Active Opportunities')).toBe('1')
    expect(getMetricValue('Closed Opportunities')).toBe('0')

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(mockedCloseOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
    })

    expect(await screen.findByText('Closed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(getMetricValue('Active Opportunities')).toBe('0')
    expect(getMetricValue('Closed Opportunities')).toBe('1')
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledTimes(1)
  })

  it('shows a pending state on the closing row while the request is in flight', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    let resolveClose: (value: Opportunity) => void = () => {}
    mockedCloseOpportunity.mockReturnValue(
      new Promise((resolve) => {
        resolveClose = resolve
      }),
    )

    renderPage()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    const pendingButton = await screen.findByRole('button', { name: 'Closing...' })
    expect(pendingButton).toBeDisabled()

    resolveClose({ ...opp1, status: 'CLOSED' })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Closing...' })).not.toBeInTheDocument()
    })
  })

  it('shows an action-specific error and keeps the opportunity OPEN when closing fails', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    mockedCloseOpportunity.mockRejectedValue(
      new Error('Unable to close this opportunity: 403'),
    )

    renderPage()

    const closeButton = await screen.findByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to close this opportunity: 403',
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('enables the Create New Opportunity button', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    const createButton = await screen.findByRole('button', {
      name: '+ Create New Opportunity',
    })
    expect(createButton).toBeEnabled()
  })

  it('navigates to the create opportunity page when clicked', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([])

    renderPage()

    const createButton = await screen.findByRole('button', {
      name: '+ Create New Opportunity',
    })
    fireEvent.click(createButton)

    expect(await screen.findByText('Create Opportunity Page')).toBeInTheDocument()
  })
})
