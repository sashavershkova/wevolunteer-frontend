import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OpportunityListItem from './OpportunityListItem'
import { opp1, opp2, opp7 } from '../../../tests/fixtures/opportunities'

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

describe('OpportunityListItem', () => {
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

  it('shows a disabled Waitlist button for a full opportunity', () => {
    renderItem(opp2, vi.fn())

    expect(screen.getByRole('button', { name: 'Waitlist' })).toBeDisabled()
  })

  it('does not show a Waitlist button for an open opportunity with room', () => {
    renderItem(opp1, vi.fn())

    expect(screen.queryByRole('button', { name: 'Waitlist' })).not.toBeInTheDocument()
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
})