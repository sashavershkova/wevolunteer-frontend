import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationVerificationPreview from './OrganizationVerificationPreview'

describe('OrganizationVerificationPreview', () => {
  it('renders the section heading', () => {
    render(<OrganizationVerificationPreview />)

    expect(screen.getByRole('heading', { name: 'Verification & Trust' })).toBeInTheDocument()
  })

  it('describes email status via account authentication without claiming verification', () => {
    render(<OrganizationVerificationPreview />)

    expect(screen.getByText('Email verification')).toBeInTheDocument()
    expect(
      screen.getByText('Verification status managed by account authentication'),
    ).toBeInTheDocument()
  })

  it('labels organization, nonprofit, and background-check status as coming soon', () => {
    render(<OrganizationVerificationPreview />)

    expect(screen.getByText('Organization verification')).toBeInTheDocument()
    expect(screen.getByText('Nonprofit or business verification')).toBeInTheDocument()
    expect(screen.getByText('Background-check requirements')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(3)
  })

  it('never claims the organization is verified', () => {
    render(<OrganizationVerificationPreview />)

    expect(screen.queryByText(/^Verified$/)).not.toBeInTheDocument()
  })
})
