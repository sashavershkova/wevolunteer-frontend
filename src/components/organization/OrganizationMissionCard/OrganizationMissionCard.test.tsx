import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationMissionCard from './OrganizationMissionCard'

describe('OrganizationMissionCard', () => {
  it('renders the real organization description when present', () => {
    render(<OrganizationMissionCard description="We distribute food to local families." />)

    expect(screen.getByRole('heading', { name: 'Mission & About' })).toBeInTheDocument()
    expect(
      screen.getByText('We distribute food to local families.'),
    ).toBeInTheDocument()
  })

  it('shows a helpful fallback when the description is blank', () => {
    render(<OrganizationMissionCard description="" />)

    expect(
      screen.getByText(
        'Add a description to tell volunteers about your organization’s mission and community impact.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a helpful fallback when the description is only whitespace', () => {
    render(<OrganizationMissionCard description="   " />)

    expect(
      screen.getByText(
        'Add a description to tell volunteers about your organization’s mission and community impact.',
      ),
    ).toBeInTheDocument()
  })

  it('includes a future-release note without presenting it as real data', () => {
    render(<OrganizationMissionCard description="Real mission text." />)

    expect(
      screen.getByText(
        'Expanded mission, impact areas, and organization history will be available in a future release.',
      ),
    ).toBeInTheDocument()
  })
})
