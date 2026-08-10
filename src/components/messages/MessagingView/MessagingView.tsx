import { useMemo, useState, type FormEvent } from 'react'
import ConversationList from '../ConversationList/ConversationList'
import MessageThread from '../MessageThread/MessageThread'
import { useMessaging } from '../../../hooks/useMessaging'
import './MessagingView.css'

export type MessagingRecipient = {
  id: string
  name: string
}

type MessagingViewProps = {
  title: string
  subtitle: string
  accessToken: string
  currentParticipantId: string
  recipients: MessagingRecipient[]
  isRecipientsLoading: boolean
  recipientLabel: string
  recipientEmptyMessage: string
  conversationEmptyMessage: string
  searchPlaceholder: string
  placeholderTitle: string
  placeholderDescription: string
}

/**
 * The whole messaging screen, shared by the volunteer and organization pages.
 *
 * <p>Those two pages were near-identical copies of each other while they held mock data, and
 * the only real differences are wording and where the recipient list comes from. Both are
 * props here, so a change to how messaging behaves cannot land on one side and miss the other.
 */
function MessagingView({
  title,
  subtitle,
  accessToken,
  currentParticipantId,
  recipients,
  isRecipientsLoading,
  recipientLabel,
  recipientEmptyMessage,
  conversationEmptyMessage,
  searchPlaceholder,
  placeholderTitle,
  placeholderDescription,
}: MessagingViewProps) {
  const messaging = useMessaging(accessToken)

  const [isComposing, setIsComposing] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [composeDraft, setComposeDraft] = useState('')

  const selectedConversation = useMemo(
    () =>
      messaging.conversations.find(
        (conversation) =>
          conversation.conversationId === messaging.selectedConversationId,
      ) ?? null,
    [messaging.conversations, messaging.selectedConversationId],
  )

  const handleCompose = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const body = composeDraft.trim()

    if (!recipientId || !body || messaging.isSending) {
      return
    }

    await messaging.startConversation(recipientId, body)

    // The hook surfaces failures through sendError rather than throwing, so the form stays
    // open with the text intact when something went wrong and only resets on success.
    setComposeDraft('')
    setRecipientId('')
    setIsComposing(false)
  }

  return (
    <main className="messaging-view">
      <header className="messaging-view-header">
        <div>
          <h1>{title}</h1>
          <p className="messaging-view-subtitle">{subtitle}</p>
        </div>

        <button
          type="button"
          className="messaging-view-compose-toggle"
          onClick={() => setIsComposing((previous) => !previous)}
          aria-expanded={isComposing}
        >
          {isComposing ? 'Cancel' : 'New message'}
        </button>
      </header>

      {isComposing && (
        <form className="messaging-view-compose" onSubmit={handleCompose}>
          <label htmlFor="messaging-view-recipient">{recipientLabel}</label>
          <select
            id="messaging-view-recipient"
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            disabled={isRecipientsLoading || recipients.length === 0}
          >
            <option value="">
              {isRecipientsLoading ? 'Loading...' : `Select a ${recipientLabel.toLowerCase()}`}
            </option>
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.name}
              </option>
            ))}
          </select>

          {!isRecipientsLoading && recipients.length === 0 && (
            <p className="messaging-view-compose-empty">{recipientEmptyMessage}</p>
          )}

          <label htmlFor="messaging-view-compose-body">Message</label>
          <textarea
            id="messaging-view-compose-body"
            rows={3}
            maxLength={2000}
            value={composeDraft}
            onChange={(event) => setComposeDraft(event.target.value)}
            disabled={messaging.isSending}
          />

          {messaging.sendError && (
            <p className="messaging-view-error" role="alert">
              {messaging.sendError}
            </p>
          )}

          <div className="messaging-view-compose-actions">
            <button
              type="submit"
              disabled={
                messaging.isSending || !recipientId || composeDraft.trim().length === 0
              }
            >
              {messaging.isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}

      <section className="messaging-view-layout" aria-label="Messages">
        <ConversationList
          conversations={messaging.conversations}
          selectedConversationId={messaging.selectedConversationId}
          onSelect={messaging.selectConversation}
          isLoading={messaging.isLoading}
          error={messaging.error}
          emptyMessage={conversationEmptyMessage}
          searchPlaceholder={searchPlaceholder}
        />

        <MessageThread
          conversation={selectedConversation}
          messages={messaging.messages}
          currentParticipantId={currentParticipantId}
          isLoading={messaging.isThreadLoading}
          error={messaging.threadError}
          isSending={messaging.isSending}
          sendError={isComposing ? null : messaging.sendError}
          onSend={messaging.sendMessage}
          placeholderTitle={placeholderTitle}
          placeholderDescription={placeholderDescription}
        />
      </section>
    </main>
  )
}

export default MessagingView
