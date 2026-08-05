import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutMeCard from './AboutMeCard'

describe('AboutMeCard', () => {
  it('renders the About Me heading', () => {
    render(<AboutMeCard />)

    expect(screen.getByRole('heading', { name: 'About Me' })).toBeInTheDocument()
  })

  it('shows a sample bio about volunteering at pet shelters', () => {
    render(<AboutMeCard />)

    expect(
      screen.getByText(/I love volunteering at local pet shelters/),
    ).toBeInTheDocument()
  })

  it('shows sample interest tags', () => {
    render(<AboutMeCard />)

    expect(screen.getByText('Animals')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByText('Food & Hunger Relief')).toBeInTheDocument()
    expect(screen.getByText('Community Outreach')).toBeInTheDocument()
  })

  it('frames the content as a preview rather than real saved data', () => {
    render(<AboutMeCard />)

    expect(
      screen.getByText(
        'This is a preview of what your profile could look like. A real bio and interest tags will be editable in a future release.',
      ),
    ).toBeInTheDocument()
  })
})