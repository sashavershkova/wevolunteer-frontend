/**
 * Client-side mirror of the backend's image rules (see ImageContentTypes on the
 * backend). The server is still the authority - it re-checks the stored object's
 * type and size before attaching it - but checking here means an oversized or
 * unsupported file never costs the user an upload round trip.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Value for a file input's accept attribute, kept in step with ALLOWED_IMAGE_TYPES. */
export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const UNSUPPORTED_IMAGE_TYPE_MESSAGE =
  'Choose a JPEG, PNG, or WebP image.'

export const IMAGE_TOO_LARGE_MESSAGE = 'Choose an image smaller than 5 MB.'

/**
 * Lower-cases the media type and drops any parameters, so that "IMAGE/JPEG" and
 * "image/jpeg; charset=utf-8" are both recognised - the same normalisation the
 * backend applies before signing the upload URL.
 */
export function normalizeImageContentType(contentType: string): string {
  const parameterStart = contentType.indexOf(';')
  const mediaType =
    parameterStart >= 0 ? contentType.slice(0, parameterStart) : contentType

  return mediaType.trim().toLowerCase()
}

export function isAllowedImageType(contentType: string): boolean {
  const normalized = normalizeImageContentType(contentType)

  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(normalized)
}

/** @returns a message to show the user, or null when the file is acceptable */
export function validateImageFile(file: File): string | null {
  if (!isAllowedImageType(file.type)) {
    return UNSUPPORTED_IMAGE_TYPE_MESSAGE
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return IMAGE_TOO_LARGE_MESSAGE
  }

  return null
}
