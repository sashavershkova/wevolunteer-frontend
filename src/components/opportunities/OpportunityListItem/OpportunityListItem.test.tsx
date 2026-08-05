import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OpportunityListItem from './OpportunityListItem'
import { opp1, opp2, opp7 } from '../../../tests/fixtures/opportunities'

// Before every existing fixture date (opp1/opp2/opp3 are all in July 2026) so
// adding expiration handling doesn't change the outcome of tests that don't
// care about it, regardless of when this suite actually runs.
const MOCKED_TODAY = '2026-07-01T12:00:00'

function renderItem(
  opportunity: typeof opp1,
  onRegister?: (opportunityId: string) => Promise<void>,
) {
  return render(
    <MemoryRouter>
      <OpportunityListItem opportunity={opportunity} onRegister={onRegister} />
    </MemoryRouter>,
  )
}

function renderItemWithFavorite(
  opportunity: typeof opp1,
  isFavorited: boolean,
  onToggleFavorite: (opportunityId: string) => Promise<void>,
) {
  return render(
    <MemoryRouter>
      <OpportunityListItem
        opportunity={opportunity}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
      />
    </MemoryRouter>,
  )
}

function renderRegisteredItem(
  opportunity: typeof opp1,
  onCancelRegistration?: (opportunityId: string) => Promise<void>,
) {
  return render(
    <MemoryRouter>
      <OpportunityListItem
        opportunity={opportunity}
        isRegistered
        onCancelRegistration={onCancelRegistration}
      />
    </MemoryRouter>,
  )
}

function renderWaitlistItem(
  opportunity: typeof opp1,
  options: {
    isWaitlisted?: boolean
    onJoinWaitlist?: (opportunityId: string) => Promise<void>
    onLeaveWaitlist?: (opportunityId: string) => Promise<void>
  } = {},
) {
  return render(
    <MemoryRouter>
      <OpportunityListItem
        opportunity={opportunity}
        isWaitlisted={options.isWaitlisted}
        onJoinWaitlist={options.onJoinWaitlist}
        onLeaveWaitlist={options.onLeaveWaitlist}
      />
    </MemoryRouter>,
  )
}

describe('OpportunityListItem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the core opportunity fields', () => {
    renderItem(opp1)

    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Seattle Food Bank')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Help sort and package food donations for local families in need.',
      ),
    ).toBeInTheDocument()
  })

  it('shows location, formatted date, and time in the meta row', () => {
    renderItem(opp1)

    expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
    expect(screen.getByText('Jul 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument()
  })

  it('omits the time row when the opportunity has no time', () => {
    renderItem(opp2)

    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument()
  })

  it('shows the legacy time unchanged for an opportunity with only legacy time', () => {
    renderItem(opp7)

    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
  })

  it('shows available spots in green when the opportunity has room', () => {
    renderItem(opp1)

    const spots = screen.getByText('9 / 10 available')
    expect(spots.closest('li')).toHaveClass('opportunity-list-item-spots-open')
  })

  it('shows "Full" in red when the opportunity has no available spots', () => {
    renderItem(opp2)

    const spots = screen.getByText('Full')
    expect(spots.closest('li')).toHaveClass('opportunity-list-item-spots-full')
  })

  it('links the card to the opportunity detail route via a stretched link', () => {
    renderItem(opp1)

    const link = screen.getByRole('link', {
      name: 'View details for Food Bank Volunteer Shift',
    })
    expect(link).toHaveAttribute('href', '/opportunities/opp1')
  })

  it('shows a Register button for an open opportunity when onRegister is provided', () => {
    renderItem(opp1, vi.fn())

    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('does not show a Register button when onRegister is not provided', () => {
    renderItem(opp1)

    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
  })

  it('does not show a Register button for a full opportunity', () => {
    renderItem(opp2, vi.fn())

    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
  })

  it('calls onRegister with the opportunity id when Register is clicked', async () => {
    const user = userEvent.setup()
    const onRegister = vi.fn().mockResolvedValue(undefined)
    renderItem(opp1, onRegister)

    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(onRegister).toHaveBeenCalledWith('opp1')
  })

  it('shows an error message and re-enables the button if registration fails', async () => {
    const user = userEvent.setup()
    const onRegister = vi.fn().mockRejectedValue(new Error('Already registered.'))
    renderItem(opp1, onRegister)

    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Already registered.')
    })
    expect(screen.getByRole('button', { name: 'Register' })).not.toBeDisabled()
  })

  it('shows a disabled Join Waitlist button for a full opportunity when no handler is provided', () => {
    renderItem(opp2, vi.fn())

    expect(screen.getByRole('button', { name: 'Join Waitlist' })).toBeDisabled()
  })

  it('does not show a waitlist button for an open opportunity with room', () => {
    renderWaitlistItem(opp1, { onJoinWaitlist: vi.fn() })

    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
  })

  it('shows an enabled Join Waitlist button for a full opportunity when onJoinWaitlist is provided', () => {
    renderWaitlistItem(opp2, { onJoinWaitlist: vi.fn() })

    expect(screen.getByRole('button', { name: 'Join Waitlist' })).toBeEnabled()
  })

  it('calls onJoinWaitlist with the opportunity id when Join Waitlist is clicked', async () => {
    const user = userEvent.setup()
    const onJoinWaitlist = vi.fn().mockResolvedValue(undefined)
    renderWaitlistItem(opp2, { onJoinWaitlist })

    await user.click(screen.getByRole('button', { name: 'Join Waitlist' }))

    expect(onJoinWaitlist).toHaveBeenCalledWith('opp2')
  })

  it('shows an error message if joining the waitlist fails', async () => {
    const user = userEvent.setup()
    const onJoinWaitlist = vi.fn().mockRejectedValue(new Error('Opportunity still has room.'))
    renderWaitlistItem(opp2, { onJoinWaitlist })

    await user.click(screen.getByRole('button', { name: 'Join Waitlist' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Opportunity still has room.')
    })
  })

  it('shows a Waitlisted badge and Leave Waitlist button when already on the waitlist', () => {
    renderWaitlistItem(opp2, { isWaitlisted: true, onLeaveWaitlist: vi.fn() })

    expect(screen.getByText('Waitlisted')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Leave Waitlist' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
  })

  it('calls onLeaveWaitlist with the opportunity id when Leave Waitlist is clicked', async () => {
    const user = userEvent.setup()
    const onLeaveWaitlist = vi.fn().mockResolvedValue(undefined)
    renderWaitlistItem(opp2, { isWaitlisted: true, onLeaveWaitlist })

    await user.click(screen.getByRole('button', { name: 'Leave Waitlist' }))

    expect(onLeaveWaitlist).toHaveBeenCalledWith('opp2')
  })

  it('shows an error message if leaving the waitlist fails', async () => {
    const user = userEvent.setup()
    const onLeaveWaitlist = vi.fn().mockRejectedValue(new Error('Unable to leave.'))
    renderWaitlistItem(opp2, { isWaitlisted: true, onLeaveWaitlist })

    await user.click(screen.getByRole('button', { name: 'Leave Waitlist' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to leave.')
    })
  })

  it('does not show a favorite heart when onToggleFavorite is not provided', () => {
    renderItem(opp1)

    expect(
      screen.queryByRole('button', { name: 'Save to favorites' }),
    ).not.toBeInTheDocument()
  })

  it('shows an unfilled heart labeled "Save to favorites" when not favorited', () => {
    renderItemWithFavorite(opp1, false, vi.fn())

    const heart = screen.getByRole('button', { name: 'Save to favorites' })
    expect(heart).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows a filled heart labeled "Remove from favorites" when favorited', () => {
    renderItemWithFavorite(opp1, true, vi.fn())

    const heart = screen.getByRole('button', { name: 'Remove from favorites' })
    expect(heart).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggleFavorite with the opportunity id when the heart is clicked', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn().mockResolvedValue(undefined)
    renderItemWithFavorite(opp1, false, onToggleFavorite)

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }))

    expect(onToggleFavorite).toHaveBeenCalledWith('opp1')
  })

  it('does not navigate to the details page when the heart is clicked', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn().mockResolvedValue(undefined)
    renderItemWithFavorite(opp1, false, onToggleFavorite)

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }))

    expect(
      screen.getByRole('link', { name: 'View details for Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
  })

  it('shows an error message if toggling the favorite fails', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn().mockRejectedValue(new Error('Unable to save.'))
    renderItemWithFavorite(opp1, false, onToggleFavorite)

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to save.')
    })
  })

  it('shows a Registered badge and Cancel Registration button instead of Register when registered', () => {
    renderRegisteredItem(opp1, vi.fn())

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
  })

  it('does not show a waitlist button for a full, registered opportunity', () => {
    renderRegisteredItem(opp2, vi.fn())

    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
    expect(screen.getByText('Registered')).toBeInTheDocument()
  })

  it('asks for confirmation and calls onCancelRegistration when confirmed', async () => {
    const user = userEvent.setup()
    const onCancelRegistration = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderRegisteredItem(opp1, onCancelRegistration)

    await user.click(screen.getByRole('button', { name: 'Cancel Registration' }))

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to cancel this registration?',
    )
    expect(onCancelRegistration).toHaveBeenCalledWith('opp1')
  })

  it('does not call onCancelRegistration when the confirmation is dismissed', async () => {
    const user = userEvent.setup()
    const onCancelRegistration = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderRegisteredItem(opp1, onCancelRegistration)

    await user.click(screen.getByRole('button', { name: 'Cancel Registration' }))

    expect(onCancelRegistration).not.toHaveBeenCalled()
  })

  it('shows an error message if cancelling the registration fails', async () => {
    const user = userEvent.setup()
    const onCancelRegistration = vi.fn().mockRejectedValue(new Error('Unable to cancel.'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderRegisteredItem(opp1, onCancelRegistration)

    await user.click(screen.getByRole('button', { name: 'Cancel Registration' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to cancel.')
    })
  })
})

describe('OpportunityListItem - image', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the opportunity image when the API returned one', () => {
    renderItem({ ...opp1, imageUrl: 'https://s3.example.com/signed-get' })

    expect(screen.getByRole('img', { name: `${opp1.title} image` })).toHaveAttribute(
      'src',
      'https://s3.example.com/signed-get',
    )
  })

  it('falls back to the grey placeholder when there is no image', () => {
    renderItem({ ...opp1, imageUrl: null })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('OpportunityListItem - expired opportunities', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const expiredOpen = { ...opp1, date: '2026-06-30' }
  const expiredFull = { ...opp2, date: '2026-06-30' }
  const todayOpen = { ...opp1, date: '2026-07-01' }
  const futureOpen = { ...opp1, date: '2026-07-02' }

  it('shows a non-interactive Completed status for an expired opportunity with open spots', () => {
    renderItem(expiredOpen, vi.fn())

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('does not show a Register button for an expired opportunity', () => {
    renderItem(expiredOpen, vi.fn())

    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
  })

  it('shows a non-interactive Completed status for an expired, full opportunity', () => {
    renderWaitlistItem(expiredFull, { onJoinWaitlist: vi.fn() })

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('does not show a Join Waitlist button for an expired, full opportunity', () => {
    renderWaitlistItem(expiredFull, { onJoinWaitlist: vi.fn() })

    expect(screen.queryByRole('button', { name: 'Join Waitlist' })).not.toBeInTheDocument()
  })

  it('does not call onRegister when clicking is not possible for an expired opportunity', async () => {
    const onRegister = vi.fn()
    renderItem(expiredOpen, onRegister)

    expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('preserves the Registered badge and Cancel Registration for an already-registered expired opportunity', () => {
    renderRegisteredItem(expiredOpen, vi.fn())

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('preserves the Waitlisted badge and Leave Waitlist for an already-waitlisted expired opportunity', () => {
    renderWaitlistItem(expiredFull, { isWaitlisted: true, onLeaveWaitlist: vi.fn() })

    expect(screen.getByText('Waitlisted')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Leave Waitlist' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('shows a Register button for an opportunity dated today', () => {
    renderItem(todayOpen, vi.fn())

    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })

  it('shows a Register button for a future opportunity', () => {
    renderItem(futureOpen, vi.fn())

    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
  })
})
