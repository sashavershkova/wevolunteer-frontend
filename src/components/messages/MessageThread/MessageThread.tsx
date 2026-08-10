import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Conversation, Message } from '../../../services/api/messageService'
import { formatMessageTimestamp } from '../../../utils/formatConversationTimestamp'
import '../MessagingButtons.css'
import './MessageThread.css'

type MessageThreadProps = {
  conversation: Conversation | null
  messages: Message[]
  currentParticipantId: string
  isLoading: boolean
  error: string | null
  isSending: boolean
  sendError: string | null
  onSend: (body: string) => Promise<void>
  placeholderTitle: string
  placeholderDescription: string
}

function MessageThread({
  conversation,
  messages,
  currentParticipantId,
  isLoading,
  error,
  isSending,
  sendError,
  onSend,
  placeholderTitle,
  placeholderDescription,
}: MessageThreadProps) {
  const endOfThreadRef = useRef<HTMLDivElement | null>(null)

  // Jump to the newest message whenever the thread changes or grows, the way every messaging
  // client does. Guarded because jsdom does not implement scrollIntoView.
  useEffect(() => {
    endOfThreadRef.current?.scrollIntoView?.({ block: 'end' })
  }, [conversation?.conversationId, messages.length])

  if (!conversation) {
    return (
      <section className="message-thread message-thread-placeholder" aria-label="Conversation">
        <h2>{placeholderTitle}</h2>
        <p>{placeholderDescription}</p>
      </section>
    )
  }

  return (
    <section className="message-thread" aria-label={`Conversation with ${conversation.counterpartName}`}>
      <header className="message-thread-header">
        <h2>{conversation.counterpartName}</h2>
      </header>

      <div className="message-thread-messages">
        {isLoading && <p className="message-thread-status">Loading messages...</p>}

        {!isLoading && error && (
          <p className="message-thread-status message-thread-error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <p className="message-thread-status">
            No messages yet. Say hello to get the conversation started.
          </p>
        )}

        {!isLoading &&
          !error &&
          messages.map((message) => {
            const isMine = message.senderId === currentParticipantId

            return (
              <article
                key={message.messageId}
                className={isMine ? 'message-bubble is-mine' : 'message-bubble'}
              >
                <p className="message-bubble-body">{message.body}</p>
                <p className="message-bubble-meta">
                  <span className="message-bubble-sender">
                    {isMine ? 'You' : conversation.counterpartName}
                  </span>
                  <span className="message-bubble-timestamp">
                    {formatMessageTimestamp(message.sentAt)}
                  </span>
                </p>
              </article>
            )
          })}

        <div ref={endOfThreadRef} />
      </div>

      <MessageComposer
        key={conversation.conversationId}
        counterpartName={conversation.counterpartName}
        isSending={isSending}
        sendError={sendError}
        onSend={onSend}
      />

    </section>
  )
}

type MessageComposerProps = {
  counterpartName: string
  isSending: boolean
  sendError: string | null
  onSend: (body: string) => Promise<void>
}

/**
 * The draft box, split out so the parent can reset it with a key.
 *
 * <p>Drafts are per-conversation: switching threads must not carry half-typed text across to
 * someone else, which is a bad way to send the wrong message to the wrong person. Remounting
 * on a new key is React's sanctioned way to reset state when a prop changes, and avoids an
 * effect that calls setState during render.
 */
function MessageComposer({
  counterpartName,
  isSending,
  sendError,
  onSend,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const body = draft.trim()

    if (!body || isSending) {
      return
    }

    // Cleared up front so the box is ready for the next message; restored below only if the
    // send failed, so a network error never silently eats what someone typed.
    setDraft('')

    try {
      await onSend(body)
    } catch {
      setDraft(body)
    }
  }

  return (
    <form className="message-thread-composer" onSubmit={handleSubmit}>
      <label className="message-thread-composer-label" htmlFor="message-thread-draft">
        Message
      </label>
      <textarea
        id="message-thread-draft"
        className="message-thread-input"
        placeholder={`Message ${counterpartName}...`}
        rows={3}
        maxLength={2000}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={isSending}
      />

      {sendError && (
        <p className="message-thread-error" role="alert">
          {sendError}
        </p>
      )}

      <div className="message-thread-composer-actions">
        <button
          type="submit"
          className="messaging-button messaging-button-primary"
          disabled={isSending || draft.trim().length === 0}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}

export default MessageThread
