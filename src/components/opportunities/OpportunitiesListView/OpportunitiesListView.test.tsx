import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OpportunitiesListView from './OpportunitiesListView'
import { mockOpportunities } from '../../../tests/fixtures/opportunities'

function renderView(props: Parameters<typeof OpportunitiesListView>[0]) {
  return render(
    <MemoryRouter>
      <OpportunitiesListView {...props} />
    </MemoryRouter>,
  )
}

describe('OpportunitiesListView', () => {
  it('renders one card per opportunity', () => {
    renderView({ opportunities: mockOpportunities })

    expect(screen.getAllByRole('article')).toHaveLength(mockOpportunities.length)
    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Park Cleanup Day' }),
    ).toBeInTheDocument()
  })

  it('shows a loading message and no cards while loading', () => {
    renderView({ opportunities: [], isLoading: true })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading opportunities...',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an error message and no cards when an error is present', () => {
    renderView({ opportunities: [], error: 'Unable to load opportunities.' })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load opportunities.',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an empty state when there are no opportunities and no error', () => {
    renderView({ opportunities: [] })

    expect(
      screen.getByText(
        'No opportunities match your search yet. Try adjusting your filters.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a custom empty message when emptyMessage is provided', () => {
    renderView({
      opportunities: [],
      emptyMessage: 'You have not created any opportunities yet.',
    })

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
