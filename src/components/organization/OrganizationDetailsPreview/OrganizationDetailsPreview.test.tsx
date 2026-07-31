import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationDetailsPreview from './OrganizationDetailsPreview'

describe('OrganizationDetailsPreview', () => {
  it('renders the section heading and future-fields label', () => {
    render(<OrganizationDetailsPreview />)

    expect(screen.getByRole('heading', { name: 'Organization Details' })).toBeInTheDocument()
    expect(screen.getByText('Future profile fields')).toBeInTheDocument()
  })

  it('labels unavailable rows as "Not configured" or "Coming soon"', () => {
    render(<OrganizationDetailsPreview />)

    expect(screen.getByText('Organization type')).toBeInTheDocument()
    expect(screen.getByText('Primary location')).toBeInTheDocument()
    expect(screen.getByText('Service area')).toBeInTheDocument()
    expect(screen.getByText('Founded')).toBeInTheDocument()
    expect(screen.getAllByText('Not configured')).toHaveLength(4)

    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Social media')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(2)
  })

  it('does not invent a real organization type, location, or founding year', () => {
    render(<OrganizationDetailsPreview />)

    expect(screen.queryByText(/Community nonprofit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Seattle/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^(19|20)\d{2}$/)).not.toBeInTheDocument()
  })
})
