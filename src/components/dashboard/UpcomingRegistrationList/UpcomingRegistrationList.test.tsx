import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UpcomingRegistrationList from './UpcomingRegistrationList'
import type { Registration } from '../../../services/api/registrationService'

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user1',
    opportunityId: 'opp1',
    title: 'Opportunity',
    date: '2026-08-10',
    location: 'Seattle, WA',
    organizationId: 'org1',
    organizationName: 'Org',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Sasha',
    email: 'sasha@example.com',
    registeredAt: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

const past = makeRegistration({ opportunityId: 'past1', title: 'Past One', date: '2020-01-01' })
const soon = makeRegistration({ opportunityId: 'soon1', title: 'Soon One', date: '2026-08-05' })
const later = makeRegistration({ opportunityId: 'later1', title: 'Later One', date: '2026-08-20' })
const latest = makeRegistration({ opportunityId: 'latest1', title: 'Latest One', date: '2026-09-01' })

function renderList(props: Partial<React.ComponentProps<typeof UpcomingRegistrationList>> = {}) {
  return render(
    <MemoryRouter>
      <UpcomingRegistrationList
        registrations={[past, soon, later, latest]}
        onCancel={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('UpcomingRegistrationList', () => {
  it('excludes past registrations', () => {
    renderList()

    expect(screen.queryByText('Past One')).not.toBeInTheDocument()
  })

  it('sorts upcoming registrations by soonest date first and limits to maxItems', () => {
    renderList({ maxItems: 2 })

    const titles = screen.getAllByText(/One$/).map((el) => el.textContent)
    expect(titles).toEqual(['Soon One', 'Later One'])
    expect(screen.queryByText('Latest One')).not.toBeInTheDocument()
  })

  it('shows a loading message and no cards while loading', () => {
    renderList({ isLoading: true })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading upcoming opportunities...',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows an error message when loading fails', () => {
    renderList({ error: 'Something went wrong.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.')
  })

  it('shows an empty state when there are no upcoming registrations', () => {
    render(
      <MemoryRouter>
        <UpcomingRegistrationList registrations={[past]} onCancel={vi.fn()} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        'You have no upcoming opportunities. Browse opportunities to sign up for one.',
      ),
    ).toBeInTheDocument()
  })
})