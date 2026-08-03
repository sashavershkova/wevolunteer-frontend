import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import VolunteerProfileCompletionPreview from './VolunteerProfileCompletionPreview'

const filledProfile = {
  userId: 'user1',
  name: 'Sasha Vershkova',
  email: 'sasha@example.com',
  role: 'VOLUNTEER' as const,
  profileImageUrl: 'https://s3.example.com/signed-get',
}

describe('VolunteerProfileCompletionPreview', () => {
  it('renders the section heading', () => {
    render(<VolunteerProfileCompletionPreview userProfile={filledProfile} />)

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument()
  })

  it('marks real populated fields as complete', () => {
    render(<VolunteerProfileCompletionPreview userProfile={filledProfile} />)

    expect(screen.getAllByText('Complete')).toHaveLength(3)
  })

  it('marks a missing profile photo as not added yet, distinct from planned fields', () => {
    render(
      <VolunteerProfileCompletionPreview
        userProfile={{ ...filledProfile, profileImageUrl: null }}
      />,
    )

    expect(screen.getAllByText('Not added yet')).toHaveLength(1)
    expect(screen.getAllByText('Complete')).toHaveLength(2)
  })

  it('shows unimplemented planned fields as coming soon', () => {
    render(<VolunteerProfileCompletionPreview userProfile={filledProfile} />)

    expect(screen.getByText('Bio')).toBeInTheDocument()
    expect(screen.getByText('Skills and interests')).toBeInTheDocument()
    expect(screen.getByText('Location and availability')).toBeInTheDocument()
    expect(screen.getByText('Verification information')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(4)
  })

  it('does not display a numeric completion percentage', () => {
    render(<VolunteerProfileCompletionPreview userProfile={filledProfile} />)

    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})