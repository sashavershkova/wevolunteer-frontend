import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessageThread from './MessageThread'
import type { Conversation, Message } from '../../../services/api/messageService'

const conversation: Conversation = {
  conversationId: 'user1_org1',
  counterpartId: 'org1',
  counterpartName: 'Seattle Food Bank',
  previewLine: 'Your shift on Saturday is confirmed.',
  lastMessageAt: '2026-08-04T17:05:09.250Z',
  unreadCount: 0,
}

const messages: Message[] = [
  {
    messageId: 'msg1',
    conversationId: 'user1_org1',
    senderId: 'user1',
    senderType: 'USER',
    body: 'Is parking available?',
    sentAt: '2026-08-04T17:00:00.000Z',
  },
  {
    messageId: 'msg2',
    conversationId: 'user1_org1',
    senderId: 'org1',
    senderType: 'ORGANIZATION',
    body: 'Yes, in the lot behind the building.',
    sentAt: '2026-08-04T17:05:09.250Z',
  },
]

function renderThread(overrides: Partial<Parameters<typeof MessageThread>[0]> = {}) {
  const onSend = vi.fn().mockResolvedValue(undefined)

  const props = {
    conversation,
    messages,
    currentParticipantId: 'user1',
    isLoading: false,
    error: null,
    isSending: false,
    sendError: null,
    onSend,
    placeholderTitle: 'Select a conversation',
    placeholderDescription: 'Choose someone on the left.',
    ...overrides,
  }

  const view = render(<MessageThread {...props} />)

  return { onSend, ...view }
}

describe('MessageThread', () => {
  it('shows the placeholder when nothing is selected', () => {
    renderThread({ conversation: null })

    expect(
      screen.getByRole('heading', { name: 'Select a conversation' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('attributes each message to the right side', () => {
    renderThread()

    expect(screen.getByText('Is parking available?')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Seattle Food Bank', { selector: '.message-bubble-sender' }))
      .toBeInTheDocument()
  })

  it('sends the trimmed draft and clears the box', async () => {
    const { onSend } = renderThread()

    const input = screen.getByRole('textbox')
    await userEvent.type(input, '  Thanks!  ')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSend).toHaveBeenCalledWith('Thanks!')
    expect(input).toHaveValue('')
  })

  it('will not send an empty or whitespace-only draft', async () => {
    const { onSend } = renderThread()

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), '   ')

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(onSend).not.toHaveBeenCalled()
  })

  it('puts the text back if the send throws, so nothing typed is lost', async () => {
    const onSend = vi.fn().mockRejectedValue(new Error('offline'))
    renderThread({ onSend })

    await userEvent.type(screen.getByRole('textbox'), 'Thanks!')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(screen.getByRole('textbox')).toHaveValue('Thanks!')
  })

  it('clears the draft when the conversation changes, so text never follows you across threads', async () => {
    const { rerender } = renderThread()

    await userEvent.type(screen.getByRole('textbox'), 'half-written')

    rerender(
      <MessageThread
        conversation={{ ...conversation, conversationId: 'user1_org2', counterpartName: 'Green City Cleanup' }}
        messages={[]}
        currentParticipantId="user1"
        isLoading={false}
        error={null}
        isSending={false}
        sendError={null}
        onSend={vi.fn()}
        placeholderTitle="Select a conversation"
        placeholderDescription="Choose someone on the left."
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('disables the composer while a send is in flight', () => {
    renderThread({ isSending: true })

    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
  })

  it('surfaces a send failure as an alert', () => {
    renderThread({ sendError: 'Unable to send this message: 500' })

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to send this message: 500')
  })

  it('invites a first message on an empty thread', () => {
    renderThread({ messages: [] })

    expect(
      screen.getByText('No messages yet. Say hello to get the conversation started.'),
    ).toBeInTheDocument()
  })
})
