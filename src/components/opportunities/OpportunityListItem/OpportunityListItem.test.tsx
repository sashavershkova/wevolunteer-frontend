import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OpportunityListItem from './OpportunityListItem'
import { opp1, opp2, opp7 } from '../../../tests/fixtures/opportunities'

describe('OpportunityListItem', () => {
  it('renders the core opportunity fields', () => {
    render(<OpportunityListItem opportunity={opp1} />)

    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Seattle Food Bank')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Help sort and package food donations for local families in need.',
      ),
    ).toBeInTheDocument()
  })

  it('formats the ISO date into a readable string', () => {
    render(<OpportunityListItem opportunity={opp1} />)

    expect(screen.getByText('Jul 10, 2026')).toBeInTheDocument()
  })

  it('shows available spots when the opportunity is open with room', () => {
    render(<OpportunityListItem opportunity={opp1} />)

    expect(screen.getByText('9 of 10 spots open')).toBeInTheDocument()
  })

  it('shows a "Full" status when availableSpots is zero but still open', () => {
    render(<OpportunityListItem opportunity={opp2} />)

    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.queryByText(/spots open/)).not.toBeInTheDocument()
  })

  it('shows a "Closed" status for closed opportunities', () => {
    render(<OpportunityListItem opportunity={opp7} />)

    expect(screen.getByText('Closed')).toBeInTheDocument()
  })
})