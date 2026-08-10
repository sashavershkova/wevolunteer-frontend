import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationMessagesPage from './OrganizationMessagesPage'
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
import { getMyOrganizationOpportunities } from '../../services/api/organizationService'
import { getOrganizationOpportunityRegistrations } from '../../services/api/registrationService'
import type { Opportunity } from '../../types/Opportunity'
import type { Registration } from '../../services/api/registrationService'

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

vi.mock('../../services/api/organizationService', () => ({
  getMyOrganizationOpportunities: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getOrganizationOpportunityRegistrations: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyConversations = vi.mocked(getMyConversations)
const mockedGetConversationMessages = vi.mocked(getConversationMessages)
const mockedMarkConversationRead = vi.mocked(markConversationRead)
const mockedSendMessage = vi.mocked(sendMessage)
const mockedStartConversation = vi.mocked(startConversation)
const mockedGetMyOrganizationOpportunities = vi.mocked(getMyOrganizationOpportunities)
const mockedGetRegistrations = vi.mocked(getOrganizationOpportunityRegistrations)

const conversation: Conversation = {
  conversationId: 'user1_org1',
  counterpartId: 'user1',
  counterpartName: 'Renata Murzina',
  previewLine: 'Is parking available?',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 1,
}

const message: Message = {
  messageId: 'msg1',
  conversationId: 'user1_org1',
  senderId: 'user1',
  senderType: 'USER',
  body: 'Is parking available?',
  sentAt: new Date().toISOString(),
}

function opportunity(opportunityId: string): Opportunity {
  return { opportunityId } as Opportunity
}

function registration(userId: string, volunteerName: string): Registration {
  return { userId, volunteerName } as Registration
}

beforeEach(() => {
  vi.clearAllMocks()

  mockedUseAppAuth.mockReturnValue({
    accessToken: 'test-token',
    userId: 'org1',
  } as ReturnType<typeof useAppAuth>)

  mockedGetMyConversations.mockResolvedValue([conversation])
  mockedGetConversationMessages.mockResolvedValue([message])
  mockedMarkConversationRead.mockResolvedValue(undefined)
  mockedGetMyOrganizationOpportunities.mockResolvedValue([])
  mockedGetRegistrations.mockResolvedValue([])
})

describe('OrganizationMessagesPage', () => {
  it('renders the organization-facing title and subtitle', async () => {
    render(<OrganizationMessagesPage />)

    expect(screen.getByRole('heading', { name: 'Messages', level: 1 })).toBeInTheDocument()
    expect(
      screen.getByText('Stay connected with volunteers before and after events.'),
    ).toBeInTheDocument()

    await waitFor(() => expect(mockedGetMyConversations).toHaveBeenCalled())
  })

  it('shows volunteers as the counterpart, not organizations', async () => {
    render(<OrganizationMessagesPage />)

    expect(
      await screen.findByRole('button', { name: /Renata Murzina/ }),
    ).toBeInTheDocument()
  })

  it('treats the organization as the sender when deciding which messages are its own', async () => {
    render(<OrganizationMessagesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Renata Murzina/ }))

    // Scoped to the thread: the same text is also the conversation preview in the list.
    const thread = await screen.findByRole('region', {
      name: /Conversation with Renata Murzina/,
    })

    // The only message was sent by the volunteer, so nothing should be attributed to "You".
    expect(within(thread).getByText('Is parking available?')).toBeInTheDocument()
    expect(within(thread).queryByText('You')).not.toBeInTheDocument()
  })

  it('sends a reply into the open thread', async () => {
    mockedSendMessage.mockResolvedValue({
      ...message,
      messageId: 'msg2',
      senderId: 'org1',
      senderType: 'ORGANIZATION',
      body: 'Yes, behind the building.',
    })

    render(<OrganizationMessagesPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Renata Murzina/ }))
    await userEvent.type(await screen.findByLabelText('Message'), 'Yes, behind the building.')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(mockedSendMessage).toHaveBeenCalledWith(
        'test-token',
        'user1_org1',
        'Yes, behind the building.',
      ),
    )
  })

  it('builds the recipient list from registrations across every opportunity, deduplicated', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([
      opportunity('opp1'),
      opportunity('opp2'),
    ])
    mockedGetRegistrations
      .mockResolvedValueOnce([
        registration('user1', 'Renata Murzina'),
        registration('user2', 'John Smith'),
      ])
      .mockResolvedValueOnce([registration('user1', 'Renata Murzina')])

    render(<OrganizationMessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))

    await screen.findByRole('option', { name: 'Renata Murzina' })
    await screen.findByRole('option', { name: 'John Smith' })

    // Placeholder plus two volunteers: user1 registered for both opportunities but appears once.
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('keeps the picker usable when one opportunity fails to load its registrations', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([
      opportunity('opp1'),
      opportunity('opp2'),
    ])
    mockedGetRegistrations
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([registration('user2', 'John Smith')])

    render(<OrganizationMessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))

    expect(await screen.findByRole('option', { name: 'John Smith' })).toBeInTheDocument()
  })

  it('starts a new conversation with a registered volunteer', async () => {
    mockedGetMyOrganizationOpportunities.mockResolvedValue([opportunity('opp1')])
    mockedGetRegistrations.mockResolvedValue([registration('user2', 'John Smith')])
    mockedStartConversation.mockResolvedValue({
      ...conversation,
      conversationId: 'user2_org1',
      counterpartId: 'user2',
      counterpartName: 'John Smith',
    })

    render(<OrganizationMessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))
    await screen.findByRole('option', { name: 'John Smith' })
    await userEvent.selectOptions(screen.getByLabelText('Volunteer'), 'user2')
    await userEvent.type(screen.getByLabelText('Message'), 'Your shift is confirmed.')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(mockedStartConversation).toHaveBeenCalledWith(
        'test-token',
        'user2',
        'Your shift is confirmed.',
      ),
    )
  })

  it('explains the empty picker before anyone has registered', async () => {
    render(<OrganizationMessagesPage />)

    await userEvent.click(screen.getByRole('button', { name: 'New message' }))

    expect(
      await screen.findByText(
        'Volunteers appear here once they register for one of your opportunities.',
      ),
    ).toBeInTheDocument()
  })
})
