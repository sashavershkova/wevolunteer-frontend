import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OpportunitiesListView from './OpportunitiesListView'
import { mockOpportunities, opp1, opp2 } from '../../../tests/fixtures/opportunities'

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

  it('marks a card as favorited when its id is in favoritedOpportunityIds', () => {
    renderView({
      opportunities: [opp1],
      favoritedOpportunityIds: new Set([opp1.opportunityId]),
      onToggleFavorite: vi.fn(),
    })

    expect(
      screen.getByRole('button', { name: 'Remove from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggleFavorite with the opportunity id when its heart is clicked', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn().mockResolvedValue(undefined)
    renderView({
      opportunities: [opp1],
      favoritedOpportunityIds: new Set(),
      onToggleFavorite,
    })

    await user.click(screen.getByRole('button', { name: 'Save to favorites' }))

    expect(onToggleFavorite).toHaveBeenCalledWith(opp1.opportunityId)
  })

  it('shows the Registered state when its id is in registeredOpportunityIds', () => {
    renderView({
      opportunities: [opp1],
      registeredOpportunityIds: new Set([opp1.opportunityId]),
      onCancelRegistration: vi.fn(),
    })

    expect(screen.getByText('Registered')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cancel Registration' }),
    ).toBeInTheDocument()
  })

  it('calls onCancelRegistration with the opportunity id when Cancel Registration is clicked', async () => {
    const user = userEvent.setup()
    const onCancelRegistration = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderView({
      opportunities: [opp1],
      registeredOpportunityIds: new Set([opp1.opportunityId]),
      onCancelRegistration,
    })

    await user.click(screen.getByRole('button', { name: 'Cancel Registration' }))

    expect(onCancelRegistration).toHaveBeenCalledWith(opp1.opportunityId)
  })

  it('shows the Waitlisted state for a full opportunity when its id is in waitlistedOpportunityIds', () => {
    renderView({
      opportunities: [opp2],
      waitlistedOpportunityIds: new Set([opp2.opportunityId]),
      onLeaveWaitlist: vi.fn(),
    })

    expect(screen.getByText('Waitlisted')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Leave Waitlist' }),
    ).toBeInTheDocument()
  })

  it('calls onJoinWaitlist with the opportunity id when Join Waitlist is clicked', async () => {
    const user = userEvent.setup()
    const onJoinWaitlist = vi.fn().mockResolvedValue(undefined)
    renderView({
      opportunities: [opp2],
      waitlistedOpportunityIds: new Set(),
      onJoinWaitlist,
    })

    await user.click(screen.getByRole('button', { name: 'Join Waitlist' }))

    expect(onJoinWaitlist).toHaveBeenCalledWith(opp2.opportunityId)
  })
})
