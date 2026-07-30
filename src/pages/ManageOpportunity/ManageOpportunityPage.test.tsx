import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ManageOpportunityPage from './ManageOpportunityPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { getOpportunity, updateOpportunity } from '../../services/api/opportunityService'
import { opp1, opp7 } from '../../tests/fixtures/opportunities'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunity = vi.mocked(getOpportunity)
const mockedUpdateOpportunity = vi.mocked(updateOpportunity)

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
    accessToken: 'test-token',
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

function renderPage(initialEntry = `/organization/opportunities/${opp1.opportunityId}/edit`) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/organization/opportunities/:opportunityId/edit"
          element={<ManageOpportunityPage />}
        />
        <Route path="/organization" element={<div>Organization Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPageWithoutOpportunityId() {
  return render(
    <MemoryRouter>
      <ManageOpportunityPage />
    </MemoryRouter>,
  )
}

describe('ManageOpportunityPage', () => {
  beforeEach(() => {
    mockedGetOpportunity.mockReset()
    mockedUpdateOpportunity.mockReset()
    mockAuth()
  })

  it('shows a loading state while the opportunity is being fetched', () => {
    mockedGetOpportunity.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading opportunity...')
  })

  it('prepopulates the form with the loaded opportunity values', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(await screen.findByLabelText('Title')).toHaveValue(opp1.title)
    expect(screen.getByLabelText('Description')).toHaveValue(opp1.description)
    expect(screen.getByLabelText('Location')).toHaveValue(opp1.location)
    expect(screen.getByLabelText('Date')).toHaveValue(opp1.date)
    expect(screen.getByLabelText('Start time')).toHaveValue(opp1.startTime as string)
    expect(screen.getByLabelText('End time')).toHaveValue(opp1.endTime as string)
    expect(screen.getByLabelText('Capacity')).toHaveValue(opp1.capacity)

    // opp1's category ('Food') is not one of the fixed dropdown options, so
    // it should surface through the Other... / Custom Category path.
    expect(screen.getByLabelText('Category')).toHaveValue('Other...')
    expect(screen.getByLabelText('Custom Category')).toHaveValue('Food')

    expect(mockedGetOpportunity).toHaveBeenCalledWith('test-token', opp1.opportunityId)
  })

  it('shows the image upload placeholder with a disabled Upload Image button', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    await screen.findByLabelText('Title')

    expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Image' })).toBeDisabled()
  })

  it('calls updateOpportunity with the correct opportunityId, changed fields, and preserved backend fields', async () => {
    const user = userEvent.setup()
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUpdateOpportunity.mockResolvedValue({ ...opp1, title: 'Updated Title' })

    renderPage()

    const titleInput = await screen.findByLabelText('Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockedUpdateOpportunity).toHaveBeenCalledTimes(1)
    })

    expect(mockedUpdateOpportunity).toHaveBeenCalledWith('test-token', opp1.opportunityId, {
      title: 'Updated Title',
      description: opp1.description,
      category: opp1.category,
      location: opp1.location,
      date: opp1.date,
      capacity: opp1.capacity,
      status: opp1.status,
      startTime: opp1.startTime,
      endTime: opp1.endTime,
      whatYoullDo: opp1.whatYoullDo,
      recurring: opp1.recurring,
    })
  })

  it('sends the edited startTime and endTime values in the update request', async () => {
    const user = userEvent.setup()
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUpdateOpportunity.mockResolvedValue({ ...opp1, startTime: '16:00', endTime: '18:00' })

    renderPage()

    const startTimeInput = await screen.findByLabelText('Start time')
    fireEvent.change(startTimeInput, { target: { value: '16:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '18:00' } })

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockedUpdateOpportunity).toHaveBeenCalledTimes(1)
    })

    expect(mockedUpdateOpportunity).toHaveBeenCalledWith(
      'test-token',
      opp1.opportunityId,
      expect.objectContaining({ startTime: '16:00', endTime: '18:00' }),
    )
  })

  it('opens with blank Start time and End time fields for a legacy-only opportunity', async () => {
    mockedGetOpportunity.mockResolvedValue(opp7)

    renderPage(`/organization/opportunities/${opp7.opportunityId}/edit`)

    expect(await screen.findByLabelText('Start time')).toHaveValue('')
    expect(screen.getByLabelText('End time')).toHaveValue('')
  })

  it('navigates to /organization after a successful update', async () => {
    const user = userEvent.setup()
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUpdateOpportunity.mockResolvedValue(opp1)

    renderPage()

    await screen.findByLabelText('Title')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Organization Dashboard Page')).toBeInTheDocument()
  })

  it('shows an error when loading the opportunity fails', async () => {
    mockedGetOpportunity.mockRejectedValue(new Error('Unable to load opportunity: 500'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load opportunity: 500',
    )
  })

  it('shows an error when the update request fails', async () => {
    const user = userEvent.setup()
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUpdateOpportunity.mockRejectedValue(
      new Error('Unable to update this opportunity: 500'),
    )

    renderPage()

    await screen.findByLabelText('Title')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Unable to update this opportunity: 500')).toBeInTheDocument()
  })

  it('shows an error and does not attempt to load when no opportunity ID is present', () => {
    renderPageWithoutOpportunityId()

    expect(screen.getByRole('alert')).toHaveTextContent('No opportunity was specified.')
    expect(mockedGetOpportunity).not.toHaveBeenCalled()
  })

  it('hides the form and shows a message when the organization does not own the opportunity', async () => {
    mockAuth({
      organizationProfile: { ...organizationFixture, organizationId: 'org-other' },
    })
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(
      await screen.findByText('Your organization cannot edit this opportunity.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
    expect(mockedUpdateOpportunity).not.toHaveBeenCalled()
  })

  it('disables the submit button while saving', async () => {
    const user = userEvent.setup()
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUpdateOpportunity.mockReturnValue(new Promise(() => {}))

    renderPage()

    await screen.findByLabelText('Title')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
