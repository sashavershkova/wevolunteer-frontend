import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConversationList from './ConversationList'
import type { Conversation } from '../../../services/api/messageService'

const seattle: Conversation = {
  conversationId: 'user1_org1',
  counterpartId: 'org1',
  counterpartName: 'Seattle Food Bank',
  previewLine: 'Your shift on Saturday is confirmed.',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 2,
}

const greenCity: Conversation = {
  conversationId: 'user1_org2',
  counterpartId: 'org2',
  counterpartName: 'Green City Cleanup',
  previewLine: 'Gloves and bags will be provided.',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
}

function renderList(overrides: Partial<Parameters<typeof ConversationList>[0]> = {}) {
  const onSelect = vi.fn()

  render(
    <ConversationList
      conversations={[seattle, greenCity]}
      selectedConversationId={null}
      onSelect={onSelect}
      isLoading={false}
      error={null}
      emptyMessage="You have no conversations yet."
      searchPlaceholder="Search conversations..."
      {...overrides}
    />,
  )

  return { onSelect }
}

describe('ConversationList', () => {
  it('renders one selectable row per conversation', () => {
    renderList()

    expect(screen.getByRole('button', { name: /Seattle Food Bank/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Green City Cleanup/ })).toBeInTheDocument()
  })

  it('reports the conversation id when a row is clicked', async () => {
    const { onSelect } = renderList()

    await userEvent.click(screen.getByRole('button', { name: /Seattle Food Bank/ }))

    expect(onSelect).toHaveBeenCalledWith('user1_org1')
  })

  it('shows an unread badge only when there is something unread', () => {
    renderList()

    expect(screen.getByLabelText('2 unread')).toBeInTheDocument()
    expect(screen.queryByLabelText('0 unread')).not.toBeInTheDocument()
  })

  it('filters on the counterpart name', async () => {
    renderList()

    await userEvent.type(screen.getByRole('searchbox'), 'green')

    expect(screen.queryByRole('button', { name: /Seattle Food Bank/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Green City Cleanup/ })).toBeInTheDocument()
  })

  it('also filters on the message preview, not just the name', async () => {
    renderList()

    await userEvent.type(screen.getByRole('searchbox'), 'gloves')

    expect(screen.getByRole('button', { name: /Green City Cleanup/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Seattle Food Bank/ })).not.toBeInTheDocument()
  })

  it('distinguishes an empty inbox from a search that matched nothing', async () => {
    const { rerender } = render(
      <ConversationList
        conversations={[]}
        selectedConversationId={null}
        onSelect={vi.fn()}
        isLoading={false}
        error={null}
        emptyMessage="You have no conversations yet."
        searchPlaceholder="Search conversations..."
      />,
    )

    expect(screen.getByText('You have no conversations yet.')).toBeInTheDocument()

    rerender(
      <ConversationList
        conversations={[seattle]}
        selectedConversationId={null}
        onSelect={vi.fn()}
        isLoading={false}
        error={null}
        emptyMessage="You have no conversations yet."
        searchPlaceholder="Search conversations..."
      />,
    )

    await userEvent.type(screen.getByRole('searchbox'), 'zzzz')

    expect(screen.getByText('No conversations match your search.')).toBeInTheDocument()
    expect(screen.queryByText('You have no conversations yet.')).not.toBeInTheDocument()
  })

  it('shows the loading state instead of the empty message while loading', () => {
    renderList({ conversations: [], isLoading: true })

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument()
    expect(screen.queryByText('You have no conversations yet.')).not.toBeInTheDocument()
  })

  it('surfaces an error as an alert', () => {
    renderList({ conversations: [], error: 'Unable to load conversations.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load conversations.')
  })

  it('marks the selected row as current for assistive technology', () => {
    renderList({ selectedConversationId: 'user1_org1' })

    expect(screen.getByRole('button', { name: /Seattle Food Bank/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })
})
