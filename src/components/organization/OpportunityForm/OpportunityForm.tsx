import { useState, type ChangeEvent, type FormEvent } from 'react'
import ImageUploadField from '../../shared/ImageUploadField/ImageUploadField'
import './OpportunityForm.css'

export type OpportunityFormInitialValues = {
  title: string
  description: string
  category: string
  location: string
  date: string
  capacity: number
  startTime: string | null
  endTime: string | null
}

export type OpportunityFormSubmitValues = {
  title: string
  description: string
  category: string
  location: string
  date: string
  capacity: number
  startTime: string
  endTime: string
}

type OpportunityFormProps = {
  initialValues?: OpportunityFormInitialValues
  submitLabel: string
  isSubmitting: boolean
  submitError: string | null
  onCancel: () => void
  onSubmit: (values: OpportunityFormSubmitValues) => void
  /**
   * Image state is owned by the page rather than the form: creating uploads the
   * file first and attaches it once the opportunity exists, while editing
   * attaches straight away.
   */
  imageUrl?: string | null
  imagePreviewUrl?: string | null
  isUploadingImage?: boolean
  imageErrorMessage?: string | null
  onSelectImage: (file: File) => void
}

type OpportunityFormState = {
  title: string
  description: string
  category: string
  customCategory: string
  location: string
  date: string
  capacity: string
  startTime: string
  endTime: string
}

type OpportunityFormErrors = Partial<Record<keyof OpportunityFormState, string>>

const OTHER_CATEGORY = 'Other...'

const CATEGORY_OPTIONS = [
  'Animal Welfare',
  'Arts & Culture',
  'Community Service',
  'Disaster Relief',
  'Education',
  'Environment',
  'Food & Hunger Relief',
  'Health',
  'Seniors',
  'Sports & Recreation',
  'Youth',
  OTHER_CATEGORY,
]

const emptyFormState: OpportunityFormState = {
  title: '',
  description: '',
  category: '',
  customCategory: '',
  location: '',
  date: '',
  capacity: '',
  startTime: '',
  endTime: '',
}

function buildFormState(initialValues?: OpportunityFormInitialValues): OpportunityFormState {
  if (!initialValues) {
    return emptyFormState
  }

  const isKnownCategory = CATEGORY_OPTIONS.includes(initialValues.category)

  return {
    title: initialValues.title,
    description: initialValues.description,
    category: isKnownCategory ? initialValues.category : OTHER_CATEGORY,
    customCategory: isKnownCategory ? '' : initialValues.category,
    location: initialValues.location,
    date: initialValues.date,
    capacity: String(initialValues.capacity),
    startTime: initialValues.startTime ?? '',
    endTime: initialValues.endTime ?? '',
  }
}

/**
 * Both values are zero-padded HH:mm strings from a native time input, so a
 * plain string comparison correctly reflects chronological order.
 */
function isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
  return endTime > startTime
}

function validateForm(form: OpportunityFormState): OpportunityFormErrors {
  const errors: OpportunityFormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!form.category) {
    errors.category = 'Please select a category.'
  } else if (form.category === OTHER_CATEGORY && !form.customCategory.trim()) {
    errors.customCategory = 'Custom category is required.'
  }

  if (!form.location.trim()) {
    errors.location = 'Location is required.'
  }

  if (!form.date.trim()) {
    errors.date = 'Date is required.'
  }

  if (!form.startTime.trim()) {
    errors.startTime = 'Start time is required.'
  }

  if (!form.endTime.trim()) {
    errors.endTime = 'End time is required.'
  }

  if (
    form.startTime.trim() &&
    form.endTime.trim() &&
    !isEndTimeAfterStartTime(form.startTime, form.endTime)
  ) {
    errors.endTime = 'End time must be later than start time.'
  }

  if (!form.capacity.trim()) {
    errors.capacity = 'Capacity is required.'
  } else if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
    errors.capacity = 'Capacity must be at least 1.'
  }

  return errors
}

function OpportunityForm({
  initialValues,
  submitLabel,
  isSubmitting,
  submitError,
  onCancel,
  onSubmit,
  imageUrl = null,
  imagePreviewUrl = null,
  isUploadingImage = false,
  imageErrorMessage = null,
  onSelectImage,
}: OpportunityFormProps) {
  const [form, setForm] = useState<OpportunityFormState>(() => buildFormState(initialValues))
  const [errors, setErrors] = useState<OpportunityFormErrors>({})

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const validationErrors = validateForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const category =
      form.category === OTHER_CATEGORY ? form.customCategory.trim() : form.category

    onSubmit({
      title: form.title,
      description: form.description,
      category,
      location: form.location,
      date: form.date,
      capacity: Number(form.capacity),
      startTime: form.startTime,
      endTime: form.endTime,
    })
  }

  return (
    <form className="create-opportunity-form" onSubmit={handleSubmit} noValidate>
      <div className="create-opportunity-field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="create-opportunity-error" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="create-opportunity-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="create-opportunity-error" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className="create-opportunity-field">
        {/* No htmlFor: the field renders its own label for the file input, and a
            second association would garble the input's accessible name. */}
        <label>
          Opportunity Image{' '}
          <span className="create-opportunity-optional-tag">(optional)</span>
        </label>
        <ImageUploadField
          inputId="opportunity-image"
          imageUrl={imageUrl}
          previewUrl={imagePreviewUrl}
          alt="Opportunity image"
          isUploading={isUploadingImage}
          errorMessage={imageErrorMessage}
          disabled={isSubmitting}
          onSelectFile={onSelectImage}
        />
      </div>

      <div className="create-opportunity-field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? 'category-error' : undefined}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="category-error" className="create-opportunity-error" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {form.category === OTHER_CATEGORY && (
        <div className="create-opportunity-field">
          <label htmlFor="customCategory">Custom Category</label>
          <input
            id="customCategory"
            name="customCategory"
            type="text"
            value={form.customCategory}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.customCategory)}
            aria-describedby={errors.customCategory ? 'customCategory-error' : undefined}
          />
          {errors.customCategory && (
            <p id="customCategory-error" className="create-opportunity-error" role="alert">
              {errors.customCategory}
            </p>
          )}
        </div>
      )}

      <div className="create-opportunity-field">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          value={form.location}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.location)}
          aria-describedby={errors.location ? 'location-error' : undefined}
        />
        {errors.location && (
          <p id="location-error" className="create-opportunity-error" role="alert">
            {errors.location}
          </p>
        )}
      </div>

      <div className="create-opportunity-field-row">
        <div className="create-opportunity-field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          {errors.date && (
            <p id="date-error" className="create-opportunity-error" role="alert">
              {errors.date}
            </p>
          )}
        </div>

        <div className="create-opportunity-field">
          <label htmlFor="startTime">Start time</label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.startTime)}
            aria-describedby={errors.startTime ? 'startTime-error' : undefined}
          />
          {errors.startTime && (
            <p id="startTime-error" className="create-opportunity-error" role="alert">
              {errors.startTime}
            </p>
          )}
        </div>

        <div className="create-opportunity-field">
          <label htmlFor="endTime">End time</label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.endTime)}
            aria-describedby={errors.endTime ? 'endTime-error' : undefined}
          />
          {errors.endTime && (
            <p id="endTime-error" className="create-opportunity-error" role="alert">
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      <div className="create-opportunity-field">
        <label htmlFor="capacity">Capacity</label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.capacity)}
          aria-describedby={errors.capacity ? 'capacity-error' : undefined}
        />
        {errors.capacity && (
          <p id="capacity-error" className="create-opportunity-error" role="alert">
            {errors.capacity}
          </p>
        )}
      </div>

      {submitError && (
        <p className="create-opportunity-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="create-opportunity-actions">
        <button
          type="button"
          className="create-opportunity-cancel-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="create-opportunity-submit-button"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export default OpportunityForm
