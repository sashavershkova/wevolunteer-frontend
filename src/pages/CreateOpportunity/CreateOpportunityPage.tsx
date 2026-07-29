import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CreateOpportunityPage.css'

type CreateOpportunityFormState = {
  title: string
  description: string
  category: string
  location: string
  date: string
  capacity: string
}

type CreateOpportunityFormErrors = Partial<Record<keyof CreateOpportunityFormState, string>>

const CATEGORY_OPTIONS = ['Food', 'Environment']

const initialFormState: CreateOpportunityFormState = {
  title: '',
  description: '',
  category: '',
  location: '',
  date: '',
  capacity: '',
}

function validateForm(form: CreateOpportunityFormState): CreateOpportunityFormErrors {
  const errors: CreateOpportunityFormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!form.category) {
    errors.category = 'Please select a category.'
  }

  if (!form.location.trim()) {
    errors.location = 'Location is required.'
  }

  if (!form.date.trim()) {
    errors.date = 'Date is required.'
  }

  if (!form.capacity.trim()) {
    errors.capacity = 'Capacity is required.'
  } else if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
    errors.capacity = 'Capacity must be at least 1.'
  }

  return errors
}

function CreateOpportunityPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<CreateOpportunityFormState>(initialFormState)
  const [errors, setErrors] = useState<CreateOpportunityFormErrors>({})

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    setErrors(validationErrors)
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

        <div className="create-opportunity-actions">
          <button
            type="button"
            className="create-opportunity-cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button type="submit" className="create-opportunity-submit-button">
            Create Opportunity
          </button>
        </div>
      </form>
    </main>
  )
}

export default CreateOpportunityPage
