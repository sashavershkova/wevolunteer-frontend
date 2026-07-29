import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreateOpportunityPage from './CreateOpportunityPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateOpportunityPage />
    </MemoryRouter>,
  )
}

describe('CreateOpportunityPage', () => {
  it('renders the Create Opportunity heading', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create Opportunity' })).toBeInTheDocument()
  })

  it('links back to the organization dashboard', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/organization',
    )
  })
})
