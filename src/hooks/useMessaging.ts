import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getConversationMessages,
  getMyConversations,
  markConversationRead,
  sendMessage as postMessage,
  startConversation as postConversation,
  type Conversation,
  type Message,
} from '../services/api/messageService'

export const DEFAULT_POLL_INTERVAL_MS = 10_000

/**
 * Messages kept together with the conversation they belong to.
 *
 * <p>Tagging rather than storing a bare array means the visible thread can be derived, so
 * switching conversations shows an empty pane immediately instead of briefly rendering the
 * previous conversation's messages under the new person's name.
 */
type LoadedThread = {
  conversationId: string
  messages: Message[]
}

export type UseMessagingResult = {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  selectedConversationId: string | null
  selectConversation: (conversationId: string) => void
  messages: Message[]
  isThreadLoading: boolean
  threadError: string | null
  isSending: boolean
  sendError: string | null
  sendMessage: (body: string) => Promise<void>
  startConversation: (recipientId: string, body: string) => Promise<void>
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/**
 * Owns every piece of messaging state both Messages pages need, so the pages themselves stay
 * presentational and the volunteer/organization versions cannot drift apart.
 *
 * <p>New messages arrive by polling rather than a socket: the backend has no WebSocket
 * infrastructure, and a refetch every ten seconds is indistinguishable from live for a page
 * people leave open. Polling pauses while the tab is hidden, so a forgotten background tab
 * does not sit there issuing requests all day, and fires immediately on becoming visible
 * again so the first thing a returning user sees is current.
 */
export function useMessaging(
  accessToken: string,
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
): UseMessagingResult {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null,
  )
  const [thread, setThread] = useState<LoadedThread | null>(null)
  const [isThreadLoading, setIsThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Read inside the polling interval, which is set up once and must not be torn down and
  // rebuilt every time the selection changes -- that would reset the timer on every click.
  // Synced in an effect rather than assigned during render, which React forbids.
  const selectedConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  const refreshConversations = useCallback(async () => {
    if (!accessToken) {
      return
    }

    const result = await getMyConversations(accessToken)
    setConversations(result)
  }, [accessToken])

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getMyConversations(accessToken)

        if (!ignore) {
          setConversations(result)
        }
      } catch (caught) {
        if (!ignore) {
          setError(toMessage(caught, 'Unable to load conversations.'))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [accessToken])

  useEffect(() => {
    let ignore = false

    if (!accessToken || !selectedConversationId) {
      return
    }

    const load = async () => {
      setIsThreadLoading(true)
      setThreadError(null)

      try {
        const result = await getConversationMessages(accessToken, selectedConversationId)

        if (!ignore) {
          setThread({ conversationId: selectedConversationId, messages: result })
        }
      } catch (caught) {
        if (!ignore) {
          setThreadError(toMessage(caught, 'Unable to load this conversation.'))
        }
      } finally {
        if (!ignore) {
          setIsThreadLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [accessToken, selectedConversationId])

  useEffect(() => {
    if (!accessToken || pollIntervalMs <= 0) {
      return
    }

    let ignore = false

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }

      const conversationId = selectedConversationIdRef.current

      try {
        const [nextConversations, nextMessages] = await Promise.all([
          getMyConversations(accessToken),
          conversationId
            ? getConversationMessages(accessToken, conversationId)
            : Promise.resolve(null),
        ])

        if (ignore) {
          return
        }

        setConversations(nextConversations)

        // Guard against a slow poll landing after the user moved to another thread and
        // overwriting it with the previous thread's messages.
        if (nextMessages && conversationId && selectedConversationIdRef.current === conversationId) {
          setThread({ conversationId, messages: nextMessages })
        }
      } catch {
        // A failed background refresh is not worth surfacing: the data already on screen is
        // still valid, and the next tick will try again. Only the foreground loads above set
        // an error the user can see.
      }
    }

    const intervalId = setInterval(() => void poll(), pollIntervalMs)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void poll()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      ignore = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [accessToken, pollIntervalMs])

  const selectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId)
      setSendError(null)

      // Zero the badge straight away. The request is best-effort -- a reader should never see
      // an error because the read receipt failed, and the next poll corrects the count if it
      // really did not land.
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      )

      if (accessToken) {
        void markConversationRead(accessToken, conversationId).catch(() => {})
      }
    },
    [accessToken],
  )

  const sendMessage = useCallback(
    async (body: string) => {
      const conversationId = selectedConversationIdRef.current

      if (!accessToken || !conversationId || !body.trim()) {
        return
      }

      setIsSending(true)
      setSendError(null)

      try {
        const sent = await postMessage(accessToken, conversationId, body)

        setThread((previous) =>
          previous && previous.conversationId === conversationId
            ? { ...previous, messages: [...previous.messages, sent] }
            : previous,
        )
        await refreshConversations()
      } catch (caught) {
        setSendError(toMessage(caught, 'Unable to send this message.'))
      } finally {
        setIsSending(false)
      }
    },
    [accessToken, refreshConversations],
  )

  const startConversation = useCallback(
    async (recipientId: string, body: string) => {
      if (!accessToken || !recipientId || !body.trim()) {
        return
      }

      setIsSending(true)
      setSendError(null)

      try {
        const conversation = await postConversation(accessToken, recipientId, body)

        await refreshConversations()
        setSelectedConversationId(conversation.conversationId)
      } catch (caught) {
        setSendError(toMessage(caught, 'Unable to start this conversation.'))
      } finally {
        setIsSending(false)
      }
    },
    [accessToken, refreshConversations],
  )

  const messages =
    thread && thread.conversationId === selectedConversationId ? thread.messages : []

  return {
    conversations,
    isLoading,
    error,
    selectedConversationId,
    selectConversation,
    messages,
    isThreadLoading,
    threadError,
    isSending,
    sendError,
    sendMessage,
    startConversation,
  }
}
