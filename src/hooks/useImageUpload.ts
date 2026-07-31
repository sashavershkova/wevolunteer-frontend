import { useCallback, useEffect, useRef, useState } from 'react'
import { validateImageFile } from '../utils/imageFile'

type UseImageUploadOptions = {
  /** Performs the upload (and any attach call) for an already-validated file. */
  onUpload: (file: File) => Promise<void>
  /** Shown when the failure carries no message of its own. */
  failureMessage?: string
}

export type ImageUpload = {
  /** Local object URL for the chosen file, shown until the server URL arrives. */
  previewUrl: string | null
  isUploading: boolean
  errorMessage: string | null
  selectFile: (file: File) => Promise<void>
}

/**
 * A local preview is a nicety, not part of the upload. Where object URLs are
 * missing or refuse the file - jsdom under test, older browsers - the upload
 * still goes ahead and the field falls back to the stored image.
 */
function createPreviewUrl(file: File): string | null {
  if (typeof URL.createObjectURL !== 'function') {
    return null
  }

  try {
    return URL.createObjectURL(file)
  } catch {
    return null
  }
}

/**
 * Shared state for the three image uploads (volunteer photo, organization logo,
 * opportunity image): validate, show the picked file straight away, run the
 * upload, and surface one error message.
 *
 * <p>Validation lives here rather than in the field component so the rules are
 * applied identically no matter which screen does the uploading.
 */
export function useImageUpload({
  onUpload,
  failureMessage = 'Unable to upload this image.',
}: UseImageUploadOptions): ImageUpload {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Held in a ref so selectFile stays stable even when the caller passes a new
  // inline function on every render.
  const uploadRef = useRef(onUpload)

  useEffect(() => {
    uploadRef.current = onUpload
  })

  const previewUrlRef = useRef<string | null>(null)

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(previewUrlRef.current)
      } catch {
        // Nothing to release, or the environment refused - either way the
        // preview is being dropped.
      }
    }

    previewUrlRef.current = null
  }, [])

  // Only on unmount: an object URL stays valid for as long as it is displayed.
  useEffect(() => releasePreview, [releasePreview])

  const selectFile = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file)

      if (validationError) {
        setErrorMessage(validationError)
        return
      }

      setErrorMessage(null)

      releasePreview()
      const nextPreviewUrl = createPreviewUrl(file)
      previewUrlRef.current = nextPreviewUrl
      setPreviewUrl(nextPreviewUrl)

      setIsUploading(true)

      try {
        await uploadRef.current(file)
      } catch (error) {
        // Drop the preview: leaving it up would suggest the image was saved.
        releasePreview()
        setPreviewUrl(null)
        setErrorMessage(error instanceof Error ? error.message : failureMessage)
      } finally {
        setIsUploading(false)
      }
    },
    [failureMessage, releasePreview],
  )

  return { previewUrl, isUploading, errorMessage, selectFile }
}
