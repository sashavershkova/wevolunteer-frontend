import { MessagesIcon } from '../../components/shared/icons'
import './MessagesPage.css'

type MockConversation = {
  id: string
  organizationName: string
  previewLine: string
  timestamp: string
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'seattle-food-bank',
    organizationName: 'Seattle Food Bank',
    previewLine: 'Your shift on Saturday is confirmed, see you then!',
    timestamp: '2:14 PM',
  },
  {
    id: 'green-city-cleanup',
    organizationName: 'Green City Cleanup',
    previewLine: 'Gloves and bags will be provided at the meeting point.',
    timestamp: 'Yesterday',
  },
  {
    id: 'northside-animal-shelter',
    organizationName: 'Northside Animal Shelter',
    previewLine: 'Thanks for helping out at the adoption event.',
    timestamp: 'Mon',
  },
  {
    id: 'riverside-community-center',
    organizationName: 'Riverside Community Center',
    previewLine: 'We have a new tutoring opportunity you might like.',
    timestamp: 'Last week',
  },
]

const PLANNED_FEATURES = [
  'Direct messaging with organizations',
  'Opportunity-specific conversations',
  'Notifications',
  'File attachments',
]

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

function MessagesPage() {
  return (
    <main className="messages-page">
      <header className="messages-header">
        <h1>Messages</h1>
        <p className="messages-subtitle">
          Stay connected with the organizations you volunteer with.
        </p>
      </header>

      <section className="messages-layout" aria-label="Messaging preview">
        <div className="messages-empty-state">
          <MessagesIcon className="messages-empty-icon" aria-hidden="true" />
          <h2>Messaging is coming soon</h2>
          <p>
            Volunteers will be able to communicate directly with organizations before and after
            opportunities.
          </p>

          <div className="messages-planned-features">
            <h3>Planned features</h3>
            <ul>
              {PLANNED_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="messages-conversations">
          <input
            type="search"
            className="messages-search"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            disabled
          />

          <ul className="messages-conversation-list">
            {MOCK_CONVERSATIONS.map((conversation) => (
              <li key={conversation.id} className="messages-conversation-card">
                <span className="messages-conversation-avatar" aria-hidden="true">
                  {getInitial(conversation.organizationName)}
                </span>
                <div className="messages-conversation-info">
                  <div className="messages-conversation-top-row">
                    <p className="messages-conversation-name">
                      {conversation.organizationName}
                    </p>
                    <span className="messages-conversation-timestamp">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="messages-conversation-preview">
                    {conversation.previewLine}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

export default MessagesPage
