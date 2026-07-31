import { describe, expect, it } from 'vitest'
import {
  IMAGE_INPUT_ACCEPT,
  IMAGE_TOO_LARGE_MESSAGE,
  MAX_IMAGE_BYTES,
  UNSUPPORTED_IMAGE_TYPE_MESSAGE,
  isAllowedImageType,
  normalizeImageContentType,
  validateImageFile,
} from './imageFile'

function buildFile(type: string, size = 1024): File {
  const file = new File(['image-bytes'], 'photo', { type })

  // jsdom derives size from the contents, so it is overridden directly rather
  // than by allocating megabytes of test data.
  Object.defineProperty(file, 'size', { value: size })

  return file
}

describe('normalizeImageContentType', () => {
  it('lower-cases the media type', () => {
    expect(normalizeImageContentType('IMAGE/JPEG')).toBe('image/jpeg')
  })

  it('drops parameters and surrounding whitespace', () => {
    expect(normalizeImageContentType(' image/png; charset=utf-8 ')).toBe('image/png')
  })
})

describe('isAllowedImageType', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(isAllowedImageType(type)).toBe(true)
  })

  it.each(['image/gif', 'application/pdf', 'text/plain', ''])(
    'rejects %s',
    (type) => {
      expect(isAllowedImageType(type)).toBe(false)
    },
  )
})

describe('IMAGE_INPUT_ACCEPT', () => {
  it('lists exactly the accepted types for the file input', () => {
    expect(IMAGE_INPUT_ACCEPT).toBe('image/jpeg,image/png,image/webp')
  })
})

describe('validateImageFile', () => {
  it('accepts a supported image within the size limit', () => {
    expect(validateImageFile(buildFile('image/jpeg'))).toBeNull()
  })

  it('rejects an unsupported type', () => {
    expect(validateImageFile(buildFile('image/gif'))).toBe(
      UNSUPPORTED_IMAGE_TYPE_MESSAGE,
    )
  })

  it('rejects a file above the 5 MB limit', () => {
    expect(validateImageFile(buildFile('image/png', MAX_IMAGE_BYTES + 1))).toBe(
      IMAGE_TOO_LARGE_MESSAGE,
    )
  })

  it('accepts a file exactly at the limit, matching the backend boundary', () => {
    expect(validateImageFile(buildFile('image/png', MAX_IMAGE_BYTES))).toBeNull()
  })
})
