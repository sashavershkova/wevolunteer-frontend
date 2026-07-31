import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import UpcomingRegistrationCard from './UpcomingRegistrationCard'
import type { Registration } from '../../../services/api/registrationService'

const registration: Registration = {
  userId: 'user1',
  opportunityId: 'opp1',
  title: 'Food Bank Volunteer Shift',
  date: '2026-08-10',
  location: 'Seattle, WA',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  registrationStatus: 'ACTIVE',
  volunteerName: 'Luxi',
  email: 'luxi@example.com',
  registeredAt: '2026-07-01T00:00:00Z',
  startTime: '09:00',
  endTime: '13:00',
}

function renderCard(onCancel = vi.fn(), isCancelling = false) {
  return render(
    <MemoryRouter>
      <UpcomingRegistrationCard
        registration={registration}
        onCancel={onCancel}
        isCancelling={isCancelling}
      />
    </MemoryRouter>,
  )
}

describe('UpcomingRegistrationCard', () => {
  it('renders the title, organization, date, and time', () => {
    renderCard()

    expect(screen.getByText('Food Bank Volunteer Shift')).toBeInTheDocument()
    expect(screen.getByText('Seattle Food Bank')).toBeInTheDocument()
    expect(screen.getByText('Aug 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM – 1:00 PM')).toBeInTheDocument()
  })

  it('links the whole card to the opportunity detail route', () => {
    renderCard()

    const link = screen.getByRole('link', {
      name: 'View Food Bank Volunteer Shift',
    })
    expect(link).toHaveAttribute('href', '/opportunities/opp1')
  })

  it('calls onCancel with the opportunity id when Cancel registration is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderCard(onCancel)

    await user.click(screen.getByRole('button', { name: 'Cancel registration' }))

    expect(onCancel).toHaveBeenCalledWith('opp1')
  })

  it('disables the cancel button and shows a pending label while cancelling', () => {
    renderCard(vi.fn(), true)

    const button = screen.getByRole('button', { name: 'Cancelling...' })
    expect(button).toBeDisabled()
  })
})