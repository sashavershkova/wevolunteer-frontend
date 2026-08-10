import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessagesPage from './MessagesPage'
import { useAppAuth } from '../../contexts/AuthContext'
import {
  getConversationMessages,
  getMyConversations,
  markConversationRead,
  sendMessage,
  startConversation,
  type Conversation,
  type Message,
} from '../../services/api/messageService'
import { getMyRegistrations } from '../../services/api/registrationService'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/messageService', () => ({
  getMyConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  markConversationRead: vi.fn(),
  sendMessage: vi.fn(),
  startConversation: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getMyRegistrations: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyConversations = vi.mocked(getMyConversations)
const mockedGetConversationMessages = vi.mocked(getConversationMessages)
const mockedMarkConversationRead = vi.mocked(markConversationRead)
const mockedSendMessage = vi.mocked(sendMessage)
const mockedStartConversation = vi.mocked(startConversation)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)

const conversation: Conversation = {
  conversationId: 'user1_org1',
  counterpartId: 'org1',
  counterpartName: 'Seattle Food Bank',
  previewLine: 'Your shift on Saturday is confirmed.',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 2,
}

const message: Message = {
  messageId: 'msg1',
  conversationId: 'user1_org1',
  senderId: 'org1',
  senderType: 'ORGANIZATION',
  body: 'Your shift on Saturday is confirmed.',
  sentAt: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()

  mockedUseAppAuth.mockReturnValue({
    accessToken: 'test-token',
    userId: 'user1',
  } as ReturnType<typeof useAppAuth>)

  mockedGetMyConversations.mockResolvedValue([conversation])
  mockedGetConversationMessages.mockResolvedValue([message])
  mockedMarkConversationRead.mockResolvedValue(undefined)
  mockedGetMyRegistrations.mockResolvedValue([])
})

describe('MessagesPage', () => {
  it('renders the page title and subtitle', async () => {
    render(<MessagesPage />)

    expect(screen.getByRole('heading', { name: 'Messages', level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText('Stay connected with the organizations you volunteer with.'),
    ).toBeInTheDocument()

    await waitFor(() => expect(mockedGetMyConversations).toHaveBeenCalled())
  })

  it('lists real conversations from the API', async () => {
    render(<MessagesPage />)

    expect(
      await screen.findByRole('button', { name: /Seattle Food Bank/ }),
    ).toBeInTheDocument()
    expect(mockedGetMyConversations).toHaveBeenCalledWith('test-token')
  })

  it('opens a thread, marks it read and clears its unread badge', async () => {
    render(<MessagesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Seattle Food Bank/ }))

    expect(mockedGetConversationMessages).toHaveBeenCalledWith('test-token', 'user1_org1')
    expect(mockedMarkConversationRead).toHaveBeenCalledWith('test-token', 'user1_org1')

    await waitFor(() =>
      expect(screen.queryByLabelText('2 unread')).not.toBeInTheDocument(),
    )
  })

  it('sends a reply into the open thread', async () => {
    mockedSendMessage.mockResolvedValue({
      ...message,
      messageId: 'msg2',
      senderId: 'user1',
      senderType: 'USER',
      body: 'See you then!',
    })

    render(<MessagesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Seattle Food Bank/ }))

    const composer = await screen.findByLabelText('Message')
    await userEvent.type(composer, 'See you then!')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(mockedSendMessage).toHaveBeenCalledWith(
        'test-token',
        'user1_org1',
        'See you then!',
      ),
    )
  })

  it('offers the organizations the volunteer has registered with as new-message recipients', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      {
        organizationId: 'org1',
        organizationName: 'Seattle Food Bank',
      },
      {
        organizationId: 'org1',
        organizationName: 'Seattle Food Bank',
      },
      {
        organizationId: 'org2',
        organizationName: 'Green City Cleanup',
      },
    ] as Awaited<ReturnType<typeof getMyRegistrations>>)

    render(<MessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))

    await screen.findByRole('option', { name: 'Seattle Food Bank' })
    await screen.findByRole('option', { name: 'Green City Cleanup' })

    // Deduplicated: two registrations with the same organization is one recipient, so the
    // placeholder plus two organizations is the whole list.
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('starts a new conversation from the compose form', async () => {
    mockedGetMyRegistrations.mockResolvedValue([
      { organizationId: 'org2', organizationName: 'Green City Cleanup' },
    ] as Awaited<ReturnType<typeof getMyRegistrations>>)
    mockedStartConversation.mockResolvedValue({
      ...conversation,
      conversationId: 'user1_org2',
      counterpartId: 'org2',
      counterpartName: 'Green City Cleanup',
    })

    render(<MessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))
    await screen.findByRole('option', { name: 'Green City Cleanup' })
    await userEvent.selectOptions(screen.getByLabelText('Organization'), 'org2')
    await userEvent.type(screen.getByLabelText('Message'), 'Do I need gloves?')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(mockedStartConversation).toHaveBeenCalledWith(
        'test-token',
        'org2',
        'Do I need gloves?',
      ),
    )
  })

  it('explains the empty picker when the volunteer has no registrations yet', async () => {
    render(<MessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))

    expect(
      await screen.findByText(
        'Register for an opportunity to start a conversation with its organization.',
      ),
    ).toBeInTheDocument()
  })

  it('surfaces a failure to load conversations', async () => {
    mockedGetMyConversations.mockRejectedValue(new Error('Unable to load conversations: 500'))

    render(<MessagesPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load conversations: 500',
    )
  })
})
