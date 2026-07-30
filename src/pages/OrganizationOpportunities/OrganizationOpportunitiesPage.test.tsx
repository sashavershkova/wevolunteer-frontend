import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationOpportunitiesPage from './OrganizationOpportunitiesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { closeOpportunity, deleteOpportunity } from '../../services/api/opportunityService'
import { opp1 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  closeOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedCloseOpportunity = vi.mocked(closeOpportunity)
const mockedDeleteOpportunity = vi.mocked(deleteOpportunity)

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
    <MemoryRouter initialEntries={['/organization/opportunities']}>
      <Routes>
        <Route path="/organization/opportunities" element={<OrganizationOpportunitiesPage />} />
        <Route
          path="/organization/opportunities/new"
          element={<div>Create Opportunity Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrganizationOpportunitiesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedCloseOpportunity.mockReset()
    mockedDeleteOpportunity.mockReset()
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads organization opportunities using the existing service', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])

    renderPage()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()
    expect(mockedGetMyOrganizationOpportunities).toHaveBeenCalledWith('token')
  })

  it('closes an opportunity and updates state locally without refetching', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opp1])
    const closedOpportunity: Opportunity = { ...opp1, status: 'CLOSED' }
    mockedCloseOpportunity.mockResolvedValue(closedOpportunity)

    renderPage()

    expect(await screen.findByText(opp1.title)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(mockedCloseOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
    })

    expect(await screen.findByText('Closed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
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

  describe('deleting an opportunity', () => {
    const closedFutureOpportunity: Opportunity = { ...opp1, status: 'CLOSED' }

    it('confirms before calling the delete API', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockResolvedValue(undefined)

      renderPage()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this opportunity? This cannot be undone.',
      )
      await waitFor(() => {
        expect(mockedDeleteOpportunity).toHaveBeenCalledWith('token', opp1.opportunityId)
      })
    })

    it('does not call the API when the confirmation is dismissed', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      renderPage()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(mockedDeleteOpportunity).not.toHaveBeenCalled()
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })

    it('removes the row from the table after a successful delete', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockResolvedValue(undefined)

      renderPage()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
      })
    })

    it('shows a pending state on the deleting row while the request is in flight', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      let resolveDelete: () => void = () => {}
      mockedDeleteOpportunity.mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
      )

      renderPage()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      const pendingButton = await screen.findByRole('button', { name: 'Deleting...' })
      expect(pendingButton).toBeDisabled()

      resolveDelete()

      await waitFor(() => {
        expect(screen.queryByText(opp1.title)).not.toBeInTheDocument()
      })
    })

    it('shows an action-specific error and keeps the row when deleting fails', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([closedFutureOpportunity])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedDeleteOpportunity.mockRejectedValue(
        new Error('Unable to delete this opportunity: 409'),
      )

      renderPage()

      const deleteButton = await screen.findByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to delete this opportunity: 409',
      )
      expect(screen.getByText(opp1.title)).toBeInTheDocument()
    })
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
