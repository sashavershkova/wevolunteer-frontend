import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationMessagesPage from './OrganizationMessagesPage'

describe('OrganizationMessagesPage', () => {
  it('renders the page title and subtitle', () => {
    render(<OrganizationMessagesPage />)

    expect(screen.getByRole('heading', { name: 'Messages', level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText('Stay connected with volunteers before and after events.'),
    ).toBeInTheDocument()
  })

  it('shows a disabled search input and mock volunteer conversations', () => {
    render(<OrganizationMessagesPage />)

    expect(screen.getByRole('searchbox', { name: 'Search conversations' })).toBeDisabled()
    expect(screen.getByText('Renata Murzina')).toBeInTheDocument()
    expect(screen.getByText('Mariya Petrova')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Mary Jones')).toBeInTheDocument()
  })

  it('shows the coming-soon empty state and planned features', () => {
    render(<OrganizationMessagesPage />)

    expect(
      screen.getByRole('heading', { name: 'Messaging is coming soon' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Direct volunteer messaging')).toBeInTheDocument()
    expect(screen.getByText('Opportunity-specific conversations')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('File attachments')).toBeInTheDocument()
  })

  it('does not render any interactive links or buttons', () => {
    render(<OrganizationMessagesPage />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
