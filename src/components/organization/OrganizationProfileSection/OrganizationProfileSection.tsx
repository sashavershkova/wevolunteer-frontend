import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useAppAuth } from '../../../contexts/AuthContext'
import {
  updateCurrentOrganization,
  type OrganizationProfile,
  type UpdateOrganizationProfileRequest,
} from '../../../services/api/organizationService'
import { uploadOrganizationProfileImage } from '../../../services/api/imageService'
import { useImageUpload } from '../../../hooks/useImageUpload'
import ImageUploadField from '../../shared/ImageUploadField/ImageUploadField'
import { OrganizationIcon, EditIcon } from '../../shared/icons'
import './OrganizationProfileSection.css'

type OrganizationProfileSectionProps = {
  organization: OrganizationProfile
  headingLevel?: 'h1' | 'h2'
}

type OrganizationFormState = {
  name: string
  description: string
  email: string
  website: string
}

type OrganizationFormErrors = Partial<Record<'name' | 'email', string>>

function buildOrganizationFormState(organization: OrganizationProfile): OrganizationFormState {
  return {
    name: organization.name,
    description: organization.description,
    email: organization.email,
    website: organization.website,
  }
}

function validateOrganizationForm(form: OrganizationFormState): OrganizationFormErrors {
  const errors: OrganizationFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Organization name is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  }

  return errors
}

function OrganizationProfileSection({
  organization,
  headingLevel = 'h2',
}: OrganizationProfileSectionProps) {
  const HeadingTag = headingLevel
  const auth = useAppAuth()
  const { accessToken } = auth

  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [organizationForm, setOrganizationForm] =
    useState<OrganizationFormState | null>(null)
  const [organizationFormErrors, setOrganizationFormErrors] =
    useState<OrganizationFormErrors>({})
  const [isSavingOrganization, setIsSavingOrganization] = useState(false)
  const [organizationSaveError, setOrganizationSaveError] =
    useState<string | null>(null)

  const logoUpload = useImageUpload({
    onUpload: async (file) => {
      if (!accessToken) {
        throw new Error('Your authentication session is unavailable.')
      }

      auth.updateOrganizationProfile(
        await uploadOrganizationProfileImage(accessToken, file),
      )
    },
  })

  function handleStartEditingOrganization() {
    setOrganizationForm(buildOrganizationFormState(organization))
    setOrganizationFormErrors({})
    setOrganizationSaveError(null)
    setIsEditingOrganization(true)
  }

  function handleCancelEditingOrganization() {
    setOrganizationForm(buildOrganizationFormState(organization))
    setOrganizationFormErrors({})
    setOrganizationSaveError(null)
    setIsEditingOrganization(false)
  }

  function handleOrganizationFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target
    setOrganizationForm((current) => (current ? { ...current, [name]: value } : current))
  }

  async function handleSaveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSavingOrganization || !organizationForm) {
      return
    }

    const validationErrors = validateOrganizationForm(organizationForm)
    setOrganizationFormErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (!accessToken) {
      setOrganizationSaveError('Your authentication session is unavailable.')
      return
    }

    setOrganizationSaveError(null)
    setIsSavingOrganization(true)

    const request: UpdateOrganizationProfileRequest = {
      name: organizationForm.name,
      description: organizationForm.description,
      email: organizationForm.email,
      website: organizationForm.website,
    }

    try {
      const updatedOrganization = await updateCurrentOrganization(accessToken, request)
      auth.updateOrganizationProfile(updatedOrganization)
      setIsEditingOrganization(false)
    } catch (error) {
      setOrganizationSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to update organization information.',
      )
    } finally {
      setIsSavingOrganization(false)
    }
  }

  return (
    <section className="organization-profile-section" aria-label="Organization profile">
      <div className="organization-profile-section-profile">
        <ImageUploadField
          inputId="organization-logo"
          variant="avatar"
          imageUrl={organization.profileImageUrl}
          previewUrl={logoUpload.previewUrl}
          alt={`${organization.name} logo`}
          uploadLabel="Upload logo"
          replaceLabel="Replace logo"
          fallback={
            <OrganizationIcon
              aria-hidden="true"
              className="organization-profile-section-logo-icon"
            />
          }
          isUploading={logoUpload.isUploading}
          errorMessage={logoUpload.errorMessage}
          onSelectFile={logoUpload.selectFile}
        />

        <div className="organization-profile-section-details">
          {isEditingOrganization && organizationForm ? (
            <form
              className="organization-profile-section-edit-form"
              onSubmit={handleSaveOrganization}
              noValidate
            >
              <div className="organization-profile-section-edit-field">
                <label htmlFor="organization-name">Organization name</label>
                <input
                  id="organization-name"
                  name="name"
                  type="text"
                  value={organizationForm.name}
                  onChange={handleOrganizationFieldChange}
                  required
                  disabled={isSavingOrganization}
                  aria-invalid={Boolean(organizationFormErrors.name)}
                  aria-describedby={
                    organizationFormErrors.name ? 'organization-name-error' : undefined
                  }
                />
                {organizationFormErrors.name && (
                  <p
                    id="organization-name-error"
                    className="organization-profile-section-edit-error"
                    role="alert"
                  >
                    {organizationFormErrors.name}
                  </p>
                )}
              </div>

              <div className="organization-profile-section-edit-field">
                <label htmlFor="organization-description">Description</label>
                <textarea
                  id="organization-description"
                  name="description"
                  value={organizationForm.description}
                  onChange={handleOrganizationFieldChange}
                  disabled={isSavingOrganization}
                />
              </div>

              <div className="organization-profile-section-edit-field">
                <label htmlFor="organization-email">Email</label>
                <input
                  id="organization-email"
                  name="email"
                  type="email"
                  value={organizationForm.email}
                  onChange={handleOrganizationFieldChange}
                  required
                  disabled={isSavingOrganization}
                  aria-invalid={Boolean(organizationFormErrors.email)}
                  aria-describedby={
                    organizationFormErrors.email ? 'organization-email-error' : undefined
                  }
                />
                {organizationFormErrors.email && (
                  <p
                    id="organization-email-error"
                    className="organization-profile-section-edit-error"
                    role="alert"
                  >
                    {organizationFormErrors.email}
                  </p>
                )}
              </div>

              <div className="organization-profile-section-edit-field">
                <label htmlFor="organization-website">Website</label>
                <input
                  id="organization-website"
                  name="website"
                  type="url"
                  value={organizationForm.website}
                  onChange={handleOrganizationFieldChange}
                  disabled={isSavingOrganization}
                />
              </div>

              {organizationSaveError && (
                <p className="organization-profile-section-edit-error" role="alert">
                  {organizationSaveError}
                </p>
              )}

              <div className="organization-profile-section-edit-actions">
                <button
                  type="button"
                  className="organization-profile-section-edit-cancel-button"
                  onClick={handleCancelEditingOrganization}
                  disabled={isSavingOrganization}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="organization-profile-section-edit-save-button"
                  disabled={isSavingOrganization}
                >
                  {isSavingOrganization ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="organization-profile-section-details-header">
                <HeadingTag>{organization.name}</HeadingTag>
                <button
                  type="button"
                  className="organization-profile-section-edit-button"
                  aria-label="Edit organization information"
                  onClick={handleStartEditingOrganization}
                >
                  <EditIcon aria-hidden="true" size={16} />
                </button>
              </div>

              {organization.description && (
                <p className="organization-profile-section-description">
                  {organization.description}
                </p>
              )}

              <dl className="organization-profile-section-meta">
                <div>
                  <dt>Email</dt>
                  <dd>{organization.email}</dd>
                </div>

                {organization.website && (
                  <div>
                    <dt>Website</dt>
                    <dd>
                      <a href={organization.website} target="_blank" rel="noreferrer">
                        {organization.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default OrganizationProfileSection
