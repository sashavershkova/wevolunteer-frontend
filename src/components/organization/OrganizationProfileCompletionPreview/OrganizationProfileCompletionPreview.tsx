import type { OrganizationProfile } from '../../../services/api/organizationService'
import { ChecklistIcon } from '../../shared/icons'
import './OrganizationProfileCompletionPreview.css'

type ChecklistItem = {
  label: string
  isComplete: boolean
  status: string
}

type OrganizationProfileCompletionPreviewProps = {
  organization: OrganizationProfile
}

function buildChecklistItems(organization: OrganizationProfile): ChecklistItem[] {
  return [
    {
      label: 'Organization name',
      isComplete: Boolean(organization.name.trim()),
      status: organization.name.trim() ? 'Complete' : 'Not added yet',
    },
    {
      label: 'Description',
      isComplete: Boolean(organization.description.trim()),
      status: organization.description.trim() ? 'Complete' : 'Not added yet',
    },
    {
      label: 'Email',
      isComplete: Boolean(organization.email.trim()),
      status: organization.email.trim() ? 'Complete' : 'Not added yet',
    },
    {
      label: 'Website',
      isComplete: Boolean(organization.website.trim()),
      status: organization.website.trim() ? 'Complete' : 'Not added yet',
    },
    { label: 'Organization logo', isComplete: false, status: 'Coming soon' },
    { label: 'Location and service area', isComplete: false, status: 'Coming soon' },
    { label: 'Social media links', isComplete: false, status: 'Coming soon' },
    { label: 'Verification information', isComplete: false, status: 'Coming soon' },
    { label: 'Team members', isComplete: false, status: 'Coming soon' },
  ]
}

function OrganizationProfileCompletionPreview({
  organization,
}: OrganizationProfileCompletionPreviewProps) {
  const items = buildChecklistItems(organization)

  return (
    <section
      className="organization-profile-completion-preview"
      aria-label="Complete your profile"
    >
      <h2>Complete Your Profile</h2>

      <ul className="organization-profile-completion-preview-list">
        {items.map((item) => (
          <li
            key={item.label}
            className={`organization-profile-completion-preview-item${
              item.isComplete ? ' organization-profile-completion-preview-item-complete' : ''
            }`}
          >
            {item.isComplete ? (
              <ChecklistIcon aria-hidden="true" size={16} />
            ) : (
              <span className="organization-profile-completion-preview-dot" aria-hidden="true" />
            )}
            <span className="organization-profile-completion-preview-label">{item.label}</span>
            <span className="organization-profile-completion-preview-status">{item.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default OrganizationProfileCompletionPreview
