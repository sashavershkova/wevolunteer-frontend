import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OpportunityForm, { type OpportunityFormInitialValues } from './OpportunityForm'

const initialValues: OpportunityFormInitialValues = {
  title: 'Beach Cleanup',
  description: 'Help clean up the local beach.',
  category: 'Environment',
  location: 'Seattle, WA',
  date: '2026-08-01',
  capacity: 5,
  startTime: '09:00',
  endTime: '12:00',
}

function renderForm(props: Partial<Parameters<typeof OpportunityForm>[0]> = {}) {
  return render(
    <OpportunityForm
      submitLabel="Save"
      isSubmitting={false}
      submitError={null}
      onCancel={vi.fn()}
      onSubmit={vi.fn()}
      onSelectImage={vi.fn()}
      {...props}
    />,
  )
}

async function fillNonTimeFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Title'), initialValues.title)
  await user.type(screen.getByLabelText('Description'), initialValues.description)
  await user.selectOptions(screen.getByLabelText('Category'), initialValues.category)
  await user.type(screen.getByLabelText('Location'), initialValues.location)
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: initialValues.date } })
  await user.type(screen.getByLabelText('Capacity'), String(initialValues.capacity))
}

describe('OpportunityForm - start/end time fields', () => {
  it('renders the Start time field as a native time input', () => {
    renderForm()

    expect(screen.getByLabelText('Start time')).toHaveAttribute('type', 'time')
  })

  it('renders the End time field as a native time input', () => {
    renderForm()

    expect(screen.getByLabelText('End time')).toHaveAttribute('type', 'time')
  })

  it('starts both fields blank when there are no initial values (create flow)', () => {
    renderForm()

    expect(screen.getByLabelText('Start time')).toHaveValue('')
    expect(screen.getByLabelText('End time')).toHaveValue('')
  })

  it('is prepopulated from initialValues.startTime and initialValues.endTime (edit flow)', () => {
    renderForm({ initialValues })

    expect(screen.getByLabelText('Start time')).toHaveValue('09:00')
    expect(screen.getByLabelText('End time')).toHaveValue('12:00')
  })

  it('does not fabricate structured values for a legacy opportunity with no startTime/endTime', () => {
    renderForm({ initialValues: { ...initialValues, startTime: null, endTime: null } })

    expect(screen.getByLabelText('Start time')).toHaveValue('')
    expect(screen.getByLabelText('End time')).toHaveValue('')
  })

  it('updates form state when start time is changed', () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '14:00' } })

    expect(screen.getByLabelText('Start time')).toHaveValue('14:00')
  })

  it('updates form state when end time is changed', () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '16:00' } })

    expect(screen.getByLabelText('End time')).toHaveValue('16:00')
  })

  it('prevents submission and shows a validation message when startTime is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    await fillNonTimeFields(user)
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '12:00' } })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Start time is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('prevents submission and shows a validation message when endTime is blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    await fillNonTimeFields(user)
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('End time is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('prevents submission when endTime equals startTime', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    await fillNonTimeFields(user)
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '09:00' } })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('End time must be later than start time.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('prevents submission when endTime is earlier than startTime', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    await fillNonTimeFields(user)
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '09:00' } })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('End time must be later than start time.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('includes both startTime and endTime, and no legacy time, once the form is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm({ onSubmit })

    await fillNonTimeFields(user)
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '12:00' } })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted).toMatchObject({ startTime: '09:00', endTime: '12:00' })
    expect(submitted).not.toHaveProperty('time')
  })
})

describe('OpportunityForm - opportunity image', () => {
  const imageFile = () =>
    new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })

  it('offers a picker limited to the image types the backend accepts', () => {
    renderForm()

    expect(screen.getByText('Opportunity Image')).toBeInTheDocument()
    expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload Image')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    )
  })

  it('hands the chosen file to onSelectImage', async () => {
    const onSelectImage = vi.fn()
    renderForm({ onSelectImage })

    const file = imageFile()
    await userEvent.upload(screen.getByLabelText('Upload Image'), file)

    expect(onSelectImage).toHaveBeenCalledWith(file)
  })

  it('shows the saved image and offers to replace it', () => {
    renderForm({ imageUrl: 'https://s3.example.com/signed-get' })

    expect(screen.getByRole('img', { name: 'Opportunity image' })).toHaveAttribute(
      'src',
      'https://s3.example.com/signed-get',
    )
    expect(screen.getByLabelText('Replace Image')).toBeInTheDocument()
  })

  it('shows the picked file before the saved image while it uploads', () => {
    renderForm({
      imageUrl: 'https://s3.example.com/old',
      imagePreviewUrl: 'blob:new',
      isUploadingImage: true,
    })

    expect(screen.getByRole('img', { name: 'Opportunity image' })).toHaveAttribute(
      'src',
      'blob:new',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Uploading...')
  })

  it('shows an image error without blocking the rest of the form', () => {
    renderForm({ imageErrorMessage: 'Choose an image smaller than 5 MB.' })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose an image smaller than 5 MB.',
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('blocks picking a new image while the form is submitting', () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByLabelText('Upload Image')).toBeDisabled()
  })
})
