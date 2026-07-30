import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegistrationCard from './RegistrationCard'
import type { Registration } from '../../services/api/registrationService'

const MOCKED_TODAY = '2026-07-29T12:00:00'

const baseRegistration: Registration = {
  userId: 'user-1',
  opportunityId: 'opp-1',
  title: 'Beach Cleanup',
  date: '2026-08-01',
  location: 'Seattle, WA',
  organizationId: 'org-1',
  organizationName: 'Green Earth',
  registrationStatus: 'ACTIVE',
  volunteerName: 'Anna Johnson',
  email: 'anna@example.com',
  registeredAt: '2026-07-24T10:00:00',
}

function renderCard(
  overrides: Partial<Registration> = {},
  onCancel = vi.fn(),
  isCancelling = false,
) {
  const registration: Registration = { ...baseRegistration, ...overrides }
  return {
    onCancel,
    ...render(
      <RegistrationCard
        registration={registration}
        onCancel={onCancel}
        isCancelling={isCancelling}
      />,
    ),
  }
}

describe('RegistrationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a readable time range when startTime and endTime are present', () => {
    renderCard({ startTime: '09:00', endTime: '13:00', time: null })

    expect(screen.getByText('9:00 AM – 1:00 PM')).toBeInTheDocument()
  })

  it('falls back to the legacy time field when startTime/endTime are unavailable', () => {
    renderCard({ startTime: null, endTime: null, time: '9:00 AM - 12:00 PM' })

    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
  })

  it('shows a graceful fallback when no time information exists at all', () => {
    renderCard({ startTime: null, endTime: null, time: null })

    expect(screen.getByText('Time not provided')).toBeInTheDocument()
  })

  it('still renders the existing date and location fields', () => {
    renderCard()

    expect(screen.getByText('2026-08-01')).toBeInTheDocument()
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
  })

  it('calls onCancel with the opportunityId when Cancel Registration is clicked', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderCard()

    await user.click(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    )

    expect(onCancel).toHaveBeenCalledWith('opp-1')
  })

  it('shows a disabled, cancelling state when isCancelling is true', () => {
    renderCard({}, vi.fn(), true)

    const button = screen.getByRole('button', { name: 'Cancelling...' })
    expect(button).toBeDisabled()
  })

  it('shows Completed and hides the Cancel Registration button for a past registration', () => {
    renderCard({ date: '2026-07-19' })

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText('Registered')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancel Registration' }),
    ).not.toBeInTheDocument()
  })

  it('shows Registered and keeps the Cancel Registration button for a registration happening today', () => {
    renderCard({ date: '2026-07-29' })

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })

  it('shows Registered and keeps the Cancel Registration button for a future registration', () => {
    renderCard({ date: '2026-08-01' })

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })
})
