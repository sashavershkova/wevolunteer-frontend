import { env } from '../../config/env'

export type ParticipantType = 'USER' | 'ORGANIZATION'

/**
 * One row in the inbox. Deliberately counterpart-relative: the backend already resolved
 * which side you are on, so the volunteer and organization pages bind to the same fields.
 */
export type Conversation = {
  conversationId: string
  counterpartId: string
  counterpartName: string
  previewLine: string
  lastMessageAt: string
  unreadCount: number
}

export type Message = {
  messageId: string
  conversationId: string
  senderId: string
  senderType: ParticipantType
  body: string
  sentAt: string
}

export async function getMyConversations(
  accessToken: string,
): Promise<Conversation[]> {
  const response = await fetch(`${env.apiUrl}/conversations/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to load conversations: ${response.status}`)
  }

  return response.json() as Promise<Conversation[]>
}

export async function getConversationMessages(
  accessToken: string,
  conversationId: string,
): Promise<Message[]> {
  const response = await fetch(
    `${env.apiUrl}/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to load messages: ${response.status}`)
  }

  return response.json() as Promise<Message[]>
}

/**
 * Opens a conversation with a counterpart and posts the first message.
 *
 * <p>The backend derives the conversation id from the two participants, so calling this for
 * a pair that already has a thread appends to it rather than creating a duplicate.
 */
export async function startConversation(
  accessToken: string,
  recipientId: string,
  body: string,
): Promise<Conversation> {
  const response = await fetch(`${env.apiUrl}/conversations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipientId, body }),
  })

  if (!response.ok) {
    throw new Error(`Unable to start this conversation: ${response.status}`)
  }

  return response.json() as Promise<Conversation>
}

export async function sendMessage(
  accessToken: string,
  conversationId: string,
  body: string,
): Promise<Message> {
  const response = await fetch(
    `${env.apiUrl}/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to send this message: ${response.status}`)
  }

  return response.json() as Promise<Message>
}

/**
 * Clears the caller's unread count. Fire-and-forget from the UI's point of view: failing to
 * mark a thread read is not worth interrupting someone who is reading it, so callers are
 * expected to swallow the rejection.
 */
export async function markConversationRead(
  accessToken: string,
  conversationId: string,
): Promise<void> {
  const response = await fetch(
    `${env.apiUrl}/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to mark this conversation read: ${response.status}`)
  }
}
