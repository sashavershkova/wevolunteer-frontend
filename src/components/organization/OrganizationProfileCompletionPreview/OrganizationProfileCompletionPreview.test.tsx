import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationProfileCompletionPreview from './OrganizationProfileCompletionPreview'

const filledOrganization = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: 'https://seattlefoodbank.org',
  profileImageUrl: null,
}

describe('OrganizationProfileCompletionPreview', () => {
  it('renders the section heading', () => {
    render(<OrganizationProfileCompletionPreview organization={filledOrganization} />)

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument()
  })

  it('marks real populated fields as complete', () => {
    render(<OrganizationProfileCompletionPreview organization={filledOrganization} />)

    expect(screen.getAllByText('Complete')).toHaveLength(4)
  })

  it('marks blank real fields as not added yet, distinct from planned fields', () => {
    render(
      <OrganizationProfileCompletionPreview
        organization={{ ...filledOrganization, description: '', website: '' }}
      />,
    )

    expect(screen.getAllByText('Not added yet')).toHaveLength(2)
    expect(screen.getAllByText('Complete')).toHaveLength(2)
  })

  it('shows unimplemented planned fields as coming soon', () => {
    render(<OrganizationProfileCompletionPreview organization={filledOrganization} />)

    expect(screen.getByText('Organization logo')).toBeInTheDocument()
    expect(screen.getByText('Location and service area')).toBeInTheDocument()
    expect(screen.getByText('Social media links')).toBeInTheDocument()
    expect(screen.getByText('Verification information')).toBeInTheDocument()
    expect(screen.getByText('Team members')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(5)
  })

  it('does not display a numeric completion percentage', () => {
    render(<OrganizationProfileCompletionPreview organization={filledOrganization} />)

    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
