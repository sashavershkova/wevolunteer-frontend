import { useMemo, useState } from 'react'
import type { Conversation } from '../../../services/api/messageService'
import { formatConversationTimestamp } from '../../../utils/formatConversationTimestamp'
import './ConversationList.css'

type ConversationListProps = {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelect: (conversationId: string) => void
  isLoading: boolean
  error: string | null
  emptyMessage: string
  searchPlaceholder: string
}

function getInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase()
}

function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  isLoading,
  error,
  emptyMessage,
  searchPlaceholder,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Search covers the preview as well as the name: "what was that message about parking?" is
  // at least as common a way to find a thread as remembering who sent it.
  const visibleConversations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()

    if (!needle) {
      return conversations
    }

    return conversations.filter(
      (conversation) =>
        conversation.counterpartName.toLowerCase().includes(needle) ||
        conversation.previewLine.toLowerCase().includes(needle),
    )
  }, [conversations, searchTerm])

  return (
    <div className="conversation-list">
      <input
        type="search"
        className="conversation-list-search"
        placeholder={searchPlaceholder}
        aria-label="Search conversations"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      {isLoading && <p className="conversation-list-status">Loading conversations...</p>}

      {!isLoading && error && (
        <p className="conversation-list-status conversation-list-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && conversations.length === 0 && (
        <p className="conversation-list-status">{emptyMessage}</p>
      )}

      {!isLoading && !error && conversations.length > 0 && visibleConversations.length === 0 && (
        <p className="conversation-list-status">No conversations match your search.</p>
      )}

      {visibleConversations.length > 0 && (
        <ul className="conversation-list-items">
          {visibleConversations.map((conversation) => {
            const isSelected = conversation.conversationId === selectedConversationId

            return (
              <li key={conversation.conversationId}>
                <button
                  type="button"
                  className={
                    isSelected
                      ? 'conversation-list-card is-selected'
                      : 'conversation-list-card'
                  }
                  aria-current={isSelected}
                  onClick={() => onSelect(conversation.conversationId)}
                >
                  <span className="conversation-list-avatar" aria-hidden="true">
                    {getInitial(conversation.counterpartName)}
                  </span>

                  <span className="conversation-list-info">
                    <span className="conversation-list-top-row">
                      <span className="conversation-list-name">
                        {conversation.counterpartName}
                      </span>
                      <span className="conversation-list-timestamp">
                        {formatConversationTimestamp(conversation.lastMessageAt)}
                      </span>
                    </span>

                    <span className="conversation-list-preview">
                      {conversation.previewLine}
                    </span>
                  </span>

                  {conversation.unreadCount > 0 && (
                    <span
                      className="conversation-list-unread"
                      aria-label={`${conversation.unreadCount} unread`}
                    >
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ConversationList
