import type { UserProfile } from '../../../services/api/userService'
import { ChecklistIcon } from '../../shared/icons'
import './VolunteerProfileCompletionPreview.css'

type ChecklistItem = {
  label: string
  isComplete: boolean
  status: string
}

type VolunteerProfileCompletionPreviewProps = {
  userProfile: UserProfile
}

function buildChecklistItems(userProfile: UserProfile): ChecklistItem[] {
  return [
    {
      label: 'Name',
      isComplete: Boolean(userProfile.name.trim()),
      status: userProfile.name.trim() ? 'Complete' : 'Not added yet',
    },
    {
      label: 'Email',
      isComplete: Boolean(userProfile.email.trim()),
      status: userProfile.email.trim() ? 'Complete' : 'Not added yet',
    },
    {
      label: 'Profile photo',
      isComplete: Boolean(userProfile.profileImageUrl),
      status: userProfile.profileImageUrl ? 'Complete' : 'Not added yet',
    },
    { label: 'Bio', isComplete: false, status: 'Coming soon' },
    { label: 'Skills and interests', isComplete: false, status: 'Coming soon' },
    { label: 'Location and availability', isComplete: false, status: 'Coming soon' },
    { label: 'Verification information', isComplete: false, status: 'Coming soon' },
  ]
}

function VolunteerProfileCompletionPreview({
  userProfile,
}: VolunteerProfileCompletionPreviewProps) {
  const items = buildChecklistItems(userProfile)

  return (
    <section
      className="volunteer-profile-completion-preview"
      aria-label="Complete your profile"
    >
      <h2>Complete Your Profile</h2>

      <ul className="volunteer-profile-completion-preview-list">
        {items.map((item) => (
          <li
            key={item.label}
            className={`volunteer-profile-completion-preview-item${
              item.isComplete ? ' volunteer-profile-completion-preview-item-complete' : ''
            }`}
          >
            {item.isComplete ? (
              <ChecklistIcon aria-hidden="true" size={16} />
            ) : (
              <span className="volunteer-profile-completion-preview-dot" aria-hidden="true" />
            )}
            <span className="volunteer-profile-completion-preview-label">{item.label}</span>
            <span className="volunteer-profile-completion-preview-status">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default VolunteerProfileCompletionPreview