import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationDashboardPage from './OrganizationDashboardPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getMyOrganizationOpportunities,
  updateCurrentOrganization,
} from '../../services/api/organizationService'
import { closeOpportunity, deleteOpportunity } from '../../services/api/opportunityService'
import { opp1 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

// opp1's date (2026-07-10) is fixed in the future relative to this mocked "today", so it
// exercises future-opportunity behavior deterministically regardless of when tests run.
const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
  updateCurrentOrganization: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  closeOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedCloseOpportunity = vi.mocked(closeOpportunity)
const mockedDeleteOpportunity = vi.mocked(deleteOpportunity)
const mockedUpdateCurrentOrganization = vi.mocked(updateCurrentOrganization)

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
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyOrganizationOpportunities.mockReset()
    mockedCloseOpportunity.mockReset()
    mockedDeleteOpportunity.mockReset()
    mockedUpdateCurrentOrganization.mockReset()
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

  describe('editing organization information', () => {
    function enterEditMode() {
      fireEvent.click(
        screen.getByRole('button', { name: 'Edit organization information' }),
      )
    }

    it('shows the edit icon with an accessible name', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()

      expect(
        await screen.findByRole('button', { name: 'Edit organization information' }),
      ).toBeInTheDocument()
    })

    it('shows prepopulated fields when the edit icon is clicked', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      expect(screen.getByLabelText('Organization name')).toHaveValue(
        organizationFixture.name,
      )
      expect(screen.getByLabelText('Description')).toHaveValue(
        organizationFixture.description,
      )
      expect(screen.getByLabelText('Email')).toHaveValue(organizationFixture.email)
      expect(screen.getByLabelText('Website')).toHaveValue(organizationFixture.website)
    })

    it('Cancel restores display mode without calling the API', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Changed Name' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: organizationFixture.name })).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })

    it('Save calls updateCurrentOrganization with the access token and edited field values', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockedUpdateCurrentOrganization.mockResolvedValue({
        ...organizationFixture,
        name: 'Updated Food Bank',
      })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(mockedUpdateCurrentOrganization).toHaveBeenCalledWith('token', {
          name: 'Updated Food Bank',
          description: organizationFixture.description,
          email: organizationFixture.email,
          website: organizationFixture.website,
        })
      })
    })

    it('calls updateOrganizationProfile after a successful save', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      const updateOrganizationProfile = vi.fn()
      mockAuth({ updateOrganizationProfile })
      const updatedOrganization = { ...organizationFixture, name: 'Updated Food Bank' }
      mockedUpdateCurrentOrganization.mockResolvedValue(updatedOrganization)

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(updateOrganizationProfile).toHaveBeenCalledWith(updatedOrganization)
      })
    })

    it('returns to display mode and shows updated information after a successful save', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      const updatedOrganization = { ...organizationFixture, name: 'Updated Food Bank' }
      mockedUpdateCurrentOrganization.mockResolvedValue(updatedOrganization)
      mockAuth({ organizationProfile: updatedOrganization })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: 'Updated Food Bank' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      })
      expect(screen.getByRole('heading', { name: 'Updated Food Bank' })).toBeInTheDocument()
    })

    it('shows an error and keeps the form open when the update fails', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockedUpdateCurrentOrganization.mockRejectedValue(
        new Error('Unable to update organization profile: 500'),
      )

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unable to update organization profile: 500',
      )
      expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
    })

    it('disables Save and Cancel while submitting', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      let resolveUpdate: (value: typeof organizationFixture) => void = () => {}
      mockedUpdateCurrentOrganization.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        }),
      )

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
      })
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

      resolveUpdate(organizationFixture)

      await waitFor(() => {
        expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
      })
    })

    it('shows an understandable error when the access token is missing', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])
      mockAuth({ accessToken: '' })

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(
        await screen.findByText('Your authentication session is unavailable.'),
      ).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })

    it('prevents the API request when name and email are blank', async () => {
      mockedGetMyOrganizationOpportunities.mockResolvedValue([])

      renderPage()
      await screen.findByRole('button', { name: 'Edit organization information' })
      enterEditMode()

      fireEvent.change(screen.getByLabelText('Organization name'), {
        target: { value: '   ' },
      })
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(await screen.findByText('Organization name is required.')).toBeInTheDocument()
      expect(screen.getByText('Email is required.')).toBeInTheDocument()
      expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
    })
  })
})
