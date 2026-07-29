import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CreateOpportunityPage from './CreateOpportunityPage'
import { createOpportunity } from '../../services/api/opportunityService'

vi.mock('../../services/api/opportunityService', () => ({
  createOpportunity: vi.fn(),
}))

const mockedCreateOpportunity = vi.mocked(createOpportunity)

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

  it('offers the existing project category values', () => {
    renderPage()

    const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement
    const optionValues = Array.from(categorySelect.options).map((option) => option.value)

    expect(optionValues).toEqual(['', 'Food', 'Environment'])
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
  })

  it('rejects a capacity value below 1', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { capacity: '0' })
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.getByText('Capacity must be at least 1.')).toBeInTheDocument()
  })

  it('clears validation errors once valid values are entered and resubmitted', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))
    expect(screen.getByText('Title is required.')).toBeInTheDocument()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'false')
  })

  it('does not navigate or call the API on a valid submission', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Opportunity' }))

    expect(screen.queryByText('Organization Dashboard Page')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create Opportunity' })).toBeInTheDocument()
    expect(mockedCreateOpportunity).not.toHaveBeenCalled()
  })
})
