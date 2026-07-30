import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ComingSoon from './ComingSoon'

describe('ComingSoon', () => {
  it('renders the given title and description', () => {
    render(<ComingSoon title="Favorites" description="Save opportunities for later." />)

    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument()
    expect(screen.getByText('Save opportunities for later.')).toBeInTheDocument()
  })
})
