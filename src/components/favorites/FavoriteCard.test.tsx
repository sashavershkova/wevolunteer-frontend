import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FavoriteCard from './FavoriteCard'
import type { Favorite } from '../../services/api/favoriteService'

const baseFavorite: Favorite = {
  userId: 'user-1',
  opportunityId: 'opp-1',
  title: 'Beach Cleanup',
  date: '2026-08-01',
  location: 'Seattle, WA',
  organizationId: 'org-1',
  organizationName: 'Green Earth',
  favoritedAt: '2026-07-24T10:00:00',
}

function renderCard(
  overrides: Partial<Favorite> = {},
  onRemove = vi.fn(),
  isRemoving = false,
) {
  const favorite: Favorite = { ...baseFavorite, ...overrides }
  return {
    onRemove,
    ...render(
      <MemoryRouter>
        <FavoriteCard favorite={favorite} onRemove={onRemove} isRemoving={isRemoving} />
      </MemoryRouter>,
    ),
  }
}

describe('FavoriteCard', () => {
  it('renders the title as a link to the opportunity details page', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Beach Cleanup' })).toHaveAttribute(
      'href',
      '/opportunities/opp-1',
    )
  })

  it('renders the organization, date, and location', () => {
    renderCard()

    expect(screen.getByText('Green Earth')).toBeInTheDocument()
    expect(screen.getByText('Aug 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument()
  })

  it('calls onRemove with the opportunityId when the remove button is clicked', async () => {
    const user = userEvent.setup()
    const { onRemove } = renderCard()

    await user.click(
      screen.getByRole('button', { name: 'Remove Beach Cleanup from favorites' }),
    )

    expect(onRemove).toHaveBeenCalledWith('opp-1')
  })

  it('disables the remove button when isRemoving is true', () => {
    renderCard({}, vi.fn(), true)

    expect(
      screen.getByRole('button', { name: 'Remove Beach Cleanup from favorites' }),
    ).toBeDisabled()
  })
})
