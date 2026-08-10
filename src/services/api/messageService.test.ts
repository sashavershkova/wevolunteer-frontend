import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getConversationMessages,
  getMyConversations,
  markConversationRead,
  sendMessage,
  startConversation,
} from './messageService'

const conversationFixture = {
  conversationId: 'user1_org1',
  counterpartId: 'org1',
  counterpartName: 'Seattle Food Bank',
  previewLine: 'Is parking available?',
  lastMessageAt: '2026-08-04T17:05:09.250Z',
  unreadCount: 2,
}

const messageFixture = {
  messageId: 'msg1',
  conversationId: 'user1_org1',
  senderId: 'user1',
  senderType: 'USER' as const,
  body: 'Is parking available?',
  sentAt: '2026-08-04T17:05:09.250Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(response: Record<string, unknown>) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('getMyConversations', () => {
  it('returns the parsed inbox on success', async () => {
    stubFetch({ ok: true, json: () => Promise.resolve([conversationFixture]) })

    await expect(getMyConversations('test-token')).resolves.toEqual([conversationFixture])
  })

  it('calls the authenticated /conversations/me endpoint with a bearer header', async () => {
    const fetchMock = stubFetch({ ok: true, json: () => Promise.resolve([]) })

    await getMyConversations('test-token')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/me'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )
  })

  it('throws when the response is not ok', async () => {
    stubFetch({ ok: false, status: 500 })

    await expect(getMyConversations('test-token')).rejects.toThrow(
      'Unable to load conversations: 500',
    )
  })
})

describe('getConversationMessages', () => {
  it('encodes the conversation id into the path', async () => {
    const fetchMock = stubFetch({ ok: true, json: () => Promise.resolve([]) })

    await getConversationMessages('test-token', 'user 1_org 1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/user%201_org%201/messages'),
      expect.anything(),
    )
  })

  it('throws when the caller is not a participant', async () => {
    stubFetch({ ok: false, status: 403 })

    await expect(getConversationMessages('test-token', 'user1_org1')).rejects.toThrow(
      'Unable to load messages: 403',
    )
  })
})

describe('startConversation', () => {
  it('posts the recipient and body as JSON', async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: () => Promise.resolve(conversationFixture),
    })

    await expect(
      startConversation('test-token', 'org1', 'Is parking available?'),
    ).resolves.toEqual(conversationFixture)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/conversations'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: 'org1', body: 'Is parking available?' }),
      }),
    )
  })

  it('throws when the sender is not allowed to open the thread', async () => {
    stubFetch({ ok: false, status: 403 })

    await expect(startConversation('test-token', 'user1', 'Hello')).rejects.toThrow(
      'Unable to start this conversation: 403',
    )
  })
})

describe('sendMessage', () => {
  it('posts only the body, since the sender comes from the token', async () => {
    const fetchMock = stubFetch({ ok: true, json: () => Promise.resolve(messageFixture) })

    await expect(sendMessage('test-token', 'user1_org1', 'Thanks!')).resolves.toEqual(
      messageFixture,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/user1_org1/messages'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ body: 'Thanks!' }),
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    stubFetch({ ok: false, status: 500 })

    await expect(sendMessage('test-token', 'user1_org1', 'Thanks!')).rejects.toThrow(
      'Unable to send this message: 500',
    )
  })
})

describe('markConversationRead', () => {
  it('posts to the read endpoint with no body', async () => {
    const fetchMock = stubFetch({ ok: true })

    await markConversationRead('test-token', 'user1_org1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/user1_org1/read'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('throws when the response is not ok so callers can choose to ignore it', async () => {
    stubFetch({ ok: false, status: 500 })

    await expect(markConversationRead('test-token', 'user1_org1')).rejects.toThrow(
      'Unable to mark this conversation read: 500',
    )
  })
})
