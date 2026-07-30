import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('shows the WeVolunteer wordmark and a copyright line for the current year', () => {
    render(<Footer />)

    expect(screen.getByText('WeVolunteer')).toBeInTheDocument()

    const year = new Date().getFullYear()
    expect(
      screen.getByText(`© ${year} WeVolunteer. All rights reserved.`),
    ).toBeInTheDocument()
  })
})
