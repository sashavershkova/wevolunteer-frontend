import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OpportunitiesListView from './OpportunitiesListView'
import { mockOpportunities } from '../../../tests/fixtures/opportunities'

describe('OpportunitiesListView', () => {
  it('renders one card per opportunity', () => {
    render(
      <MemoryRouter>
        <OpportunitiesListView opportunities={mockOpportunities} />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('article')).toHaveLength(mockOpportunities.length)
    expect(
      screen.getByRole('heading', { name: 'Food Bank Volunteer Shift' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Park Cleanup Day' }),
    ).toBeInTheDocument()
  })

  it('shows a loading message and no cards while loading', () => {
    render(
      <MemoryRouter>
        <OpportunitiesListView opportunities={[]} isLoading />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading opportunities...',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an error message and no cards when an error is present', () => {
    render(
      <MemoryRouter>
        <OpportunitiesListView
          opportunities={[]}
          error="Unable to load opportunities."
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load opportunities.',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an empty state when there are no opportunities and no error', () => {
    render(
      <MemoryRouter>
        <OpportunitiesListView opportunities={[]} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        'No opportunities match your search yet. Try adjusting your filters.',
      ),
    ).toBeInTheDocument()
  })
})