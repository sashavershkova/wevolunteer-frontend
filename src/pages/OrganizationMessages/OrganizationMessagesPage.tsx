import { MessagesIcon } from '../../components/shared/icons'
import './OrganizationMessagesPage.css'

type MockConversation = {
  id: string
  volunteerName: string
  previewLine: string
  timestamp: string
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'renata-murzina',
    volunteerName: 'Renata Murzina',
    previewLine: 'Thanks for confirming the shift, see you Saturday!',
    timestamp: '2:14 PM',
  },
  {
    id: 'mariya-petrova',
    volunteerName: 'Mariya Petrova',
    previewLine: 'Is parking available near the community center?',
    timestamp: 'Yesterday',
  },
  {
    id: 'john-smith',
    volunteerName: 'John Smith',
    previewLine: 'Looking forward to helping out again this month.',
    timestamp: 'Mon',
  },
  {
    id: 'mary-jones',
    volunteerName: 'Mary Jones',
    previewLine: 'Could I bring a friend along to volunteer too?',
    timestamp: 'Last week',
  },
]

const PLANNED_FEATURES = [
  'Direct volunteer messaging',
  'Opportunity-specific conversations',
  'Read receipts',
  'Notifications',
  'File attachments',
]

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

function OrganizationMessagesPage() {
  return (
    <main className="organization-messages-page">
      <header className="organization-messages-header">
        <h1>Messages</h1>
        <p className="organization-messages-subtitle">
          Stay connected with volunteers before and after events.
        </p>
      </header>

      <section className="organization-messages-layout" aria-label="Messaging preview">
        <div className="organization-messages-conversations">
          <input
            type="search"
            className="organization-messages-search"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            disabled
          />

          <ul className="organization-messages-conversation-list">
            {MOCK_CONVERSATIONS.map((conversation) => (
              <li key={conversation.id} className="organization-messages-conversation-card">
                <span className="organization-messages-conversation-avatar" aria-hidden="true">
                  {getInitial(conversation.volunteerName)}
                </span>
                <div className="organization-messages-conversation-info">
                  <div className="organization-messages-conversation-top-row">
                    <p className="organization-messages-conversation-name">
                      {conversation.volunteerName}
                    </p>
                    <span className="organization-messages-conversation-timestamp">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="organization-messages-conversation-preview">
                    {conversation.previewLine}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="organization-messages-empty-state">
          <MessagesIcon className="organization-messages-empty-icon" aria-hidden="true" />
          <h2>Messaging is coming soon</h2>
          <p>
            Organizations will be able to communicate directly with volunteers before and after
            opportunities.
          </p>

          <div className="organization-messages-planned-features">
            <h3>Planned features</h3>
            <ul>
              {PLANNED_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

export default OrganizationMessagesPage
