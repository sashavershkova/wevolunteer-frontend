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
    expect(screen.getByText(opp1.time as string)).toBeInTheDocument()
  })

  it('omits the time row when the opportunity has no time', () => {
    renderItem(opp2)

    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument()
  })

  it('shows spots filled in green when the opportunity has room', () => {
    renderItem(opp1)

    const spots = screen.getByText('1/10 spots filled')
    expect(spots.closest('li')).toHaveClass('opportunity-list-item-spots-open')
  })

  it('shows spots filled in orange when the opportunity is full', () => {
    renderItem(opp2)

    const spots = screen.getByText('8/8 spots filled')
    expect(spots.closest('li')).toHaveClass('opportunity-list-item-spots-full')
  })

  it('shows "Closed" instead of a spot count for closed opportunities', () => {
    renderItem(opp7)

    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.queryByText(/spots filled/)).not.toBeInTheDocument()
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

  it('does not show a Register button for a closed opportunity', () => {
    renderItem(opp7, vi.fn())

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

  it('does not show a Waitlist button for a closed opportunity', () => {
    renderItem(opp7, vi.fn())

    expect(screen.queryByRole('button', { name: 'Waitlist' })).not.toBeInTheDocument()
  })
})