import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OpportunitiesListView from './OpportunitiesListView'
import { mockOpportunities } from '../../../tests/fixtures/opportunities'

describe('OpportunitiesListView', () => {
  it('renders one card per opportunity', () => {
    render(<OpportunitiesListView opportunities={mockOpportunities} />)

    expect(screen.getAllByRole('article')).toHaveLength(mockOpportunities.length)
    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Park Cleanup Day' }),
    ).toBeInTheDocument()
  })

  it('shows a loading message and no cards while loading', () => {
    render(<OpportunitiesListView opportunities={[]} isLoading />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading opportunities...',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an error message and no cards when an error is present', () => {
    render(
      <OpportunitiesListView
        opportunities={[]}
        error="Unable to load opportunities."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load opportunities.',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an empty state when there are no opportunities and no error', () => {
    render(<OpportunitiesListView opportunities={[]} />)

    expect(
      screen.getByText(
        'No opportunities match your search yet. Try adjusting your filters.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a custom empty message when emptyMessage is provided', () => {
    render(
      <OpportunitiesListView
        opportunities={[]}
        emptyMessage="You have not created any opportunities yet."
      />,
    )

    expect(
      screen.getByText('You have not created any opportunities yet.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'No opportunities match your search yet. Try adjusting your filters.',
      ),
    ).not.toBeInTheDocument()
  })
})