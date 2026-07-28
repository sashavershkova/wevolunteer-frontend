import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OpportunityListItem from './OpportunityListItem'
import { opp1, opp2, opp7 } from '../../../tests/fixtures/opportunities'

function renderItem(opportunity: typeof opp1) {
  return render(
    <MemoryRouter>
      <OpportunityListItem opportunity={opportunity} />
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

  it('shows location, formatted date, and placeholder time in the meta row', () => {
    renderItem(opp1)

    expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
    expect(screen.getByText('Jul 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM - 1:00 PM')).toBeInTheDocument()
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

  it('links the whole card to the opportunity detail route', () => {
    renderItem(opp1)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/opportunities/opp1')
  })
})