import { useAppAuth } from '../../contexts/AuthContext'
import MessagingView from '../../components/messages/MessagingView/MessagingView'
import { useOrganizationMessageRecipients } from '../../hooks/useMessageRecipients'

function OrganizationMessagesPage() {
  const auth = useAppAuth()
  const { recipients, isLoading } = useOrganizationMessageRecipients(auth.accessToken)

  return (
    <MessagingView
      title="Messages"
      subtitle="Stay connected with volunteers before and after events."
      accessToken={auth.accessToken}
      currentParticipantId={auth.userId}
      recipients={recipients}
      isRecipientsLoading={isLoading}
      recipientLabel="Volunteer"
      recipientEmptyMessage="Volunteers appear here once they register for one of your opportunities."
      conversationEmptyMessage="You have no conversations yet."
      searchPlaceholder="Search conversations..."
      placeholderTitle="Select a conversation"
      placeholderDescription="Choose a volunteer on the left to read and reply to your messages."
    />
  )
}

export default OrganizationMessagesPage
