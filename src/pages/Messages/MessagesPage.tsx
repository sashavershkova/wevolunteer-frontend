import { useAppAuth } from '../../contexts/AuthContext'
import MessagingView from '../../components/messages/MessagingView/MessagingView'
import { useVolunteerMessageRecipients } from '../../hooks/useMessageRecipients'

function MessagesPage() {
  const auth = useAppAuth()
  const { recipients, isLoading } = useVolunteerMessageRecipients(auth.accessToken)

  return (
    <MessagingView
      title="Messages"
      subtitle="Stay connected with the organizations you volunteer with."
      accessToken={auth.accessToken}
      currentParticipantId={auth.userId}
      recipients={recipients}
      isRecipientsLoading={isLoading}
      recipientLabel="Organization"
      recipientEmptyMessage="Register for an opportunity to start a conversation with its organization."
      conversationEmptyMessage="You have no conversations yet."
      searchPlaceholder="Search conversations..."
      placeholderTitle="Select a conversation"
      placeholderDescription="Choose an organization on the left to read and reply to your messages."
    />
  )
}

export default MessagesPage
