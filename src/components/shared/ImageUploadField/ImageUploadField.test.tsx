import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUploadField from './ImageUploadField'

function renderField(
  props: Partial<Parameters<typeof ImageUploadField>[0]> = {},
) {
  return render(
    <ImageUploadField
      inputId="test-image"
      imageUrl={null}
      alt="Opportunity image"
      onSelectFile={vi.fn()}
      {...props}
    />,
  )
}

describe('ImageUploadField', () => {
  it('shows the empty state when there is no image', () => {
    renderField()

    expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('labels the control "Upload Image" when empty', () => {
    renderField()

    expect(screen.getByLabelText('Upload Image')).toHaveAttribute('type', 'file')
  })

  it('labels the control "Replace Image" once an image exists', () => {
    renderField({ imageUrl: 'https://s3.example.com/signed-get' })

    expect(screen.getByLabelText('Replace Image')).toBeInTheDocument()
    expect(screen.queryByText('No image uploaded')).not.toBeInTheDocument()
  })

  it('accepts only the image types the backend allows', () => {
    renderField()

    expect(screen.getByLabelText('Upload Image')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    )
  })

  it('renders the API image with the given alt text', () => {
    renderField({ imageUrl: 'https://s3.example.com/signed-get' })

    expect(screen.getByRole('img', { name: 'Opportunity image' })).toHaveAttribute(
      'src',
      'https://s3.example.com/signed-get',
    )
  })

  it('prefers the local preview over the stored image while uploading', () => {
    renderField({
      imageUrl: 'https://s3.example.com/old',
      previewUrl: 'blob:new',
    })

    expect(screen.getByRole('img', { name: 'Opportunity image' })).toHaveAttribute(
      'src',
      'blob:new',
    )
  })

  it('passes the chosen file to onSelectFile', async () => {
    const onSelectFile = vi.fn()
    renderField({ onSelectFile })

    const file = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Upload Image'), file)

    expect(onSelectFile).toHaveBeenCalledWith(file)
  })

  it('clears the input so the same file can be retried after a failure', async () => {
    renderField()

    const input = screen.getByLabelText('Upload Image') as HTMLInputElement
    await userEvent.upload(
      input,
      new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' }),
    )

    expect(input.value).toBe('')
  })

  it('announces the upload in progress and disables the input', () => {
    renderField({ isUploading: true })

    expect(screen.getByRole('status')).toHaveTextContent('Uploading...')
    expect(screen.getByLabelText('Upload Image')).toBeDisabled()
  })

  it('disables the input when the surrounding form is busy', () => {
    renderField({ disabled: true })

    expect(screen.getByLabelText('Upload Image')).toBeDisabled()
  })

  it('shows an error message as an alert', () => {
    renderField({ errorMessage: 'Choose an image smaller than 5 MB.' })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose an image smaller than 5 MB.',
    )
  })

  it('renders a fallback instead of the default empty state', () => {
    renderField({
      variant: 'avatar',
      fallback: <span role="img" aria-label="Sasha Vershkova avatar">SV</span>,
    })

    expect(
      screen.getByRole('img', { name: 'Sasha Vershkova avatar' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('No image uploaded')).not.toBeInTheDocument()
  })
})
