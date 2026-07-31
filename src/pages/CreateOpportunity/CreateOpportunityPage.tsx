import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppAuth } from '../../contexts/AuthContext'
import { createOpportunity } from '../../services/api/opportunityService'
import {
  attachOpportunityImage,
  uploadOpportunityImage,
} from '../../services/api/imageService'
import { useImageUpload } from '../../hooks/useImageUpload'
import OpportunityForm, {
  type OpportunityFormSubmitValues,
} from '../../components/organization/OpportunityForm/OpportunityForm'
import './CreateOpportunityPage.css'

function CreateOpportunityPage() {
  const navigate = useNavigate()
  const auth = useAppAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // The opportunity does not exist yet, so the file goes to S3 as soon as it is
  // chosen and only the returned key is held until the create request succeeds.
  const [imageObjectKey, setImageObjectKey] = useState<string | null>(null)

  const imageUpload = useImageUpload({
    onUpload: async (file) => {
      if (!auth.accessToken) {
        throw new Error('Your authentication session is unavailable.')
      }

      setImageObjectKey(await uploadOpportunityImage(auth.accessToken, file))
    },
  })

  async function handleSubmit(values: OpportunityFormSubmitValues) {
    if (!auth.accessToken) {
      setSubmitError('Your authentication session is unavailable.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const created = await createOpportunity(auth.accessToken, {
        opportunityId: crypto.randomUUID(),
        ...values,
      })

      if (imageObjectKey) {
        try {
          await attachOpportunityImage(
            auth.accessToken,
            created.opportunityId,
            imageObjectKey,
          )
        } catch {
          // The opportunity itself was created, so say so rather than implying
          // the whole submission failed.
          setSubmitError(
            'This opportunity was created, but its image could not be saved. ' +
              'You can add the image from the edit page.',
          )
          return
        }
      }

      navigate('/organization')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to create this opportunity.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    navigate('/organization')
  }

  return (
    <main className="create-opportunity-page">
      <Link to="/organization" className="create-opportunity-back-link">
        &larr; Back to Dashboard
      </Link>

      <header className="create-opportunity-header">
        <h1>Create Opportunity</h1>
        <p className="create-opportunity-subtitle">
          Add a new volunteer opportunity for your organization.
        </p>
      </header>

      <OpportunityForm
        submitLabel="Create Opportunity"
        isSubmitting={isSubmitting}
        submitError={submitError}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        imagePreviewUrl={imageUpload.previewUrl}
        isUploadingImage={imageUpload.isUploading}
        imageErrorMessage={imageUpload.errorMessage}
        onSelectImage={imageUpload.selectFile}
      />
    </main>
  )
}

export default CreateOpportunityPage
