import type { ChangeEvent, ReactNode } from 'react'
import { UploadPhotoIcon } from '../icons'
import { IMAGE_INPUT_ACCEPT } from '../../../utils/imageFile'
import './ImageUploadField.css'

type ImageUploadFieldProps = {
  /** Ties the visible button to the hidden file input; must be unique per page. */
  inputId: string
  /** Pre-signed URL from the API, or null when nothing has been uploaded yet. */
  imageUrl: string | null
  /** Local preview of a just-picked file; shown ahead of imageUrl. */
  previewUrl?: string | null
  alt: string
  variant?: 'card' | 'avatar'
  uploadLabel?: string
  replaceLabel?: string
  emptyText?: string
  /** Rendered instead of the default empty state, e.g. a set of initials. */
  fallback?: ReactNode
  isUploading?: boolean
  errorMessage?: string | null
  disabled?: boolean
  onSelectFile: (file: File) => void
}

/**
 * The picker and preview for a single image.
 *
 * <p>Purely presentational: it knows nothing about S3 or the API. The visible
 * control is a label for a hidden file input rather than a button, which keeps
 * the native file dialog and keyboard behaviour without any scripting.
 */
function ImageUploadField({
  inputId,
  imageUrl,
  previewUrl = null,
  alt,
  variant = 'card',
  uploadLabel = 'Upload Image',
  replaceLabel = 'Replace Image',
  emptyText = 'No image uploaded',
  fallback,
  isUploading = false,
  errorMessage = null,
  disabled = false,
  onSelectFile,
}: ImageUploadFieldProps) {
  const displayedUrl = previewUrl ?? imageUrl
  const buttonLabel = displayedUrl ? replaceLabel : uploadLabel
  const isDisabled = disabled || isUploading

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    // Resetting lets the same file be picked again after a failed upload.
    event.target.value = ''

    if (file) {
      onSelectFile(file)
    }
  }

  return (
    <div className={`image-upload-field image-upload-field-${variant}`}>
      <div className="image-upload-field-frame">
        {displayedUrl ? (
          <img className="image-upload-field-image" src={displayedUrl} alt={alt} />
        ) : (
          fallback ?? (
            <>
              <UploadPhotoIcon aria-hidden="true" className="image-upload-field-icon" />
              <p className="image-upload-field-empty-text">{emptyText}</p>
            </>
          )
        )}
      </div>

      <input
        id={inputId}
        className="image-upload-field-input"
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        disabled={isDisabled}
        onChange={handleChange}
      />
      <label
        htmlFor={inputId}
        className={
          isDisabled
            ? 'image-upload-field-button is-disabled'
            : 'image-upload-field-button'
        }
      >
        {buttonLabel}
      </label>

      <p className="image-upload-field-hint">JPEG, PNG, or WebP. Up to 5 MB.</p>

      {isUploading && (
        <p className="image-upload-field-status" role="status">
          Uploading...
        </p>
      )}

      {errorMessage && (
        <p className="image-upload-field-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export default ImageUploadField
