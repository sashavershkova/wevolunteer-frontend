import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessagesPage from './MessagesPage'

describe('MessagesPage', () => {
  it('renders the page title and subtitle', () => {
    render(<MessagesPage />)

    expect(screen.getByRole('heading', { name: 'Messages', level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText('Stay connected with the organizations you volunteer with.'),
    ).toBeInTheDocument()
  })

  it('shows a disabled search input and mock organization conversations', () => {
    render(<MessagesPage />)

    expect(screen.getByRole('searchbox', { name: 'Search conversations' })).toBeDisabled()
    expect(screen.getByText('Seattle Food Bank')).toBeInTheDocument()
    expect(screen.getByText('Green City Cleanup')).toBeInTheDocument()
    expect(screen.getByText('Northside Animal Shelter')).toBeInTheDocument()
    expect(screen.getByText('Riverside Community Center')).toBeInTheDocument()
  })

  it('shows the coming-soon empty state and planned features', () => {
    render(<MessagesPage />)

    expect(
      screen.getByRole('heading', { name: 'Messaging is coming soon' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Direct messaging with organizations')).toBeInTheDocument()
    expect(screen.getByText('Opportunity-specific conversations')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('File attachments')).toBeInTheDocument()
  })

  it('does not render any interactive links or buttons', () => {
    render(<MessagesPage />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
