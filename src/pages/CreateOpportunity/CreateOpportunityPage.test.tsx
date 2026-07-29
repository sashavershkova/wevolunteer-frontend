import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CreateOpportunityPage from './CreateOpportunityPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { createOpportunity } from '../../services/api/opportunityService'
import { opp1 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  createOpportunity: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedCreateOpportunity = vi.mocked(createOpportunity)

const GENERATED_UUID = '11111111-1111-1111-1111-111111111111'

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'org@example.com',
    userId: 'org1',
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
    <MemoryRouter initialEntries={['/organization/opportunities/new']}>
      <Routes>
        <Route path="/organization/opportunities/new" element={<CreateOpportunityPage />} />
        <Route path="/organization" element={<div>Organization Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const validFormValues = {
  title: 'Beach Cleanup',
  description: 'Help clean up the local beach.',
  category: 'Environment',
  location: 'Seattle, WA',
  capacity: '5',
}

async function fillValidForm(user: UserEvent, overrides: Partial<typeof validFormValues> = {}) {
  const values = { ...validFormValues, ...overrides }

  await user.type(screen.getByLabelText('Title'), values.title)
  await user.type(screen.getByLabelText('Description'), values.description)
  await user.selectOptions(screen.getByLabelText('Category'), values.category)
  await user.type(screen.getByLabelText('Location'), values.location)
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-08-01' } })
  await user.type(screen.getByLabelText('Capacity'), values.capacity)
}

describe('CreateOpportunityPage', () => {
  beforeEach(() => {
    mockedCreateOpportunity.mockReset()
    mockAuth()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(GENERATED_UUID)
  })

  it('renders the Create Opportunity heading', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create Opportunity' })).toBeInTheDocument()
  })

  it('links back to the organization dashboard', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/organization',
    )
  })

  it('renders all six fields with accessible labels', () => {
    renderPage()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Location')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Capacity')).toBeInTheDocument()
  })

  it('offers the expanded project category values', () => {
    renderPage()

    const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement
    const optionValues = Array.from(categorySelect.options).map((option) => option.value)

    expect(optionValues).toEqual([
      '',
      'Environment',
      'Food & Hunger Relief',
      'Education',
      'Community Service',
      'Health',
      'Animal Welfare',
      'Seniors',
      'Youth',
      'Disaster Relief',
      'Arts & Culture',
      'Sports & Recreation',
      'Other...',
    ])
  })

  it('hides the Custom Category field until "Other..." is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByLabelText('Custom Category')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Category'), 'Other...')
    expect(screen.getByLabelText('Custom Category')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Category'), 'Environment')
    expect(screen.queryByLabelText('Custom Category')).not.toBeInTheDocument()
  })

  it('requires a Custom Category value when "Other..." is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { category: 'Other...' })
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.getByText('Custom category is required.')).toBeInTheDocument()
    expect(mockedCreateOpportunity).not.toHaveBeenCalled()
  })

  it('sends the Custom Category text instead of "Other..." on submission', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockResolvedValue(opp1)
    renderPage()

    await fillValidForm(user, { category: 'Other...' })
    await user.type(screen.getByLabelText('Custom Category'), 'Housing Assistance')
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    await waitFor(() => {
      expect(mockedCreateOpportunity).toHaveBeenCalledTimes(1)
    })

    expect(mockedCreateOpportunity.mock.calls[0][1]).toMatchObject({
      category: 'Housing Assistance',
    })
  })

  it('the Create Opportunity button is a submit button', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Create Opportunity' })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  it('navigates to /organization when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Organization Dashboard Page')).toBeInTheDocument()
  })

  it('shows validation feedback when submitting an empty form', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(screen.getByText('Please select a category.')).toBeInTheDocument()
    expect(screen.getByText('Location is required.')).toBeInTheDocument()
    expect(screen.getByText('Date is required.')).toBeInTheDocument()
    expect(screen.getByText('Capacity is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-describedby', 'title-error')
    expect(mockedCreateOpportunity).not.toHaveBeenCalled()
  })

  it('rejects a capacity value below 1', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { capacity: '0' })
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.getByText('Capacity must be at least 1.')).toBeInTheDocument()
    expect(mockedCreateOpportunity).not.toHaveBeenCalled()
  })

  it('clears validation errors once valid values are entered and resubmitted', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockReturnValue(new Promise(() => {}))
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))
    expect(screen.getByText('Title is required.')).toBeInTheDocument()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'false')
  })

  it('calls createOpportunity exactly once with the AuthContext token, a generated opportunityId, and capacity as a number', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockResolvedValue(opp1)
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    await waitFor(() => {
      expect(mockedCreateOpportunity).toHaveBeenCalledTimes(1)
    })

    expect(mockedCreateOpportunity).toHaveBeenCalledWith('test-token', {
      opportunityId: GENERATED_UUID,
      title: validFormValues.title,
      description: validFormValues.description,
      category: validFormValues.category,
      location: validFormValues.location,
      date: '2026-08-01',
      capacity: 5,
    })
  })

  it('does not send organizationId, organizationName, status, registeredCount, or availableSpots', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockResolvedValue(opp1)
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    await waitFor(() => {
      expect(mockedCreateOpportunity).toHaveBeenCalledTimes(1)
    })

    const sentRequest = mockedCreateOpportunity.mock.calls[0][1]

    expect(sentRequest).not.toHaveProperty('organizationId')
    expect(sentRequest).not.toHaveProperty('organizationName')
    expect(sentRequest).not.toHaveProperty('status')
    expect(sentRequest).not.toHaveProperty('registeredCount')
    expect(sentRequest).not.toHaveProperty('availableSpots')
  })

  it('navigates to /organization after a successful submission', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockResolvedValue(opp1)
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(await screen.findByText('Organization Dashboard Page')).toBeInTheDocument()
  })

  it('displays an error and keeps the form filled in when the request fails', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity.mockRejectedValue(
      new Error('Unable to create this opportunity: 500'),
    )
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(await screen.findByText('Unable to create this opportunity: 500')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue(validFormValues.title)
    expect(screen.getByRole('heading', { name: 'Create Opportunity' })).toBeInTheDocument()
  })

  it('disables both buttons while the request is in flight', async () => {
    const user = userEvent.setup()
    let resolveCreate: (value: Opportunity) => void = () => {}
    mockedCreateOpportunity.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.getByRole('button', { name: 'Create Opportunity' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    resolveCreate(opp1)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Opportunity' })).not.toBeDisabled()
    })
  })

  it('allows the user to retry after a failed submission', async () => {
    const user = userEvent.setup()
    mockedCreateOpportunity
      .mockRejectedValueOnce(new Error('Unable to create this opportunity: 500'))
      .mockResolvedValueOnce(opp1)
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))
    expect(await screen.findByText('Unable to create this opportunity: 500')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue(validFormValues.title)

    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(await screen.findByText('Organization Dashboard Page')).toBeInTheDocument()
    expect(mockedCreateOpportunity).toHaveBeenCalledTimes(2)
  })
})
