import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useImageUpload } from './useImageUpload'
import {
  IMAGE_TOO_LARGE_MESSAGE,
  MAX_IMAGE_BYTES,
  UNSUPPORTED_IMAGE_TYPE_MESSAGE,
} from '../utils/imageFile'

function buildFile(type = 'image/jpeg', size = 1024): File {
  const file = new File(['image-bytes'], 'photo.jpg', { type })

  Object.defineProperty(file, 'size', { value: size })

  return file
}

// jsdom implements neither of these, so they are installed per test and the
// hook's own guard is exercised separately.
const createObjectURL: ReturnType<typeof vi.fn<() => string>> = vi.fn(
  () => 'blob:preview',
)
const revokeObjectURL = vi.fn()

describe('useImageUpload', () => {
  beforeEach(() => {
    createObjectURL.mockReset()
    createObjectURL.mockReturnValue('blob:preview')
    revokeObjectURL.mockClear()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL')
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('uploads a supported file and shows a preview of it', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    const file = buildFile()
    await act(async () => {
      await result.current.selectFile(file)
    })

    expect(onUpload).toHaveBeenCalledWith(file)
    expect(result.current.previewUrl).toBe('blob:preview')
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.isUploading).toBe(false)
  })

  it('reports isUploading while the upload is in flight', async () => {
    let finishUpload: (() => void) | undefined
    const onUpload = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishUpload = resolve
        }),
    )
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    act(() => {
      void result.current.selectFile(buildFile())
    })

    await waitFor(() => expect(result.current.isUploading).toBe(true))

    await act(async () => {
      finishUpload?.()
    })

    expect(result.current.isUploading).toBe(false)
  })

  it('rejects an unsupported type without calling onUpload', async () => {
    const onUpload = vi.fn()
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile('image/gif'))
    })

    expect(onUpload).not.toHaveBeenCalled()
    expect(result.current.errorMessage).toBe(UNSUPPORTED_IMAGE_TYPE_MESSAGE)
    expect(result.current.previewUrl).toBeNull()
  })

  it('rejects a file over the size limit without calling onUpload', async () => {
    const onUpload = vi.fn()
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile('image/png', MAX_IMAGE_BYTES + 1))
    })

    expect(onUpload).not.toHaveBeenCalled()
    expect(result.current.errorMessage).toBe(IMAGE_TOO_LARGE_MESSAGE)
  })

  it('surfaces the failure message and drops the preview when the upload fails', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('Unable to upload the image: 403'))
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    expect(result.current.errorMessage).toBe('Unable to upload the image: 403')
    // Keeping the preview would suggest the image had been saved.
    expect(result.current.previewUrl).toBeNull()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('falls back to the supplied message when the failure carries none', async () => {
    const onUpload = vi.fn().mockRejectedValue('no message')
    const { result } = renderHook(() =>
      useImageUpload({ onUpload, failureMessage: 'Unable to upload your photo.' }),
    )

    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    expect(result.current.errorMessage).toBe('Unable to upload your photo.')
  })

  it('clears an earlier error once a valid file is chosen', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile('application/pdf'))
    })
    expect(result.current.errorMessage).toBe(UNSUPPORTED_IMAGE_TYPE_MESSAGE)

    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    expect(result.current.errorMessage).toBeNull()
  })

  it('releases the previous preview when a second file is chosen', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    createObjectURL
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second')
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile())
    })
    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
    expect(result.current.previewUrl).toBe('blob:second')
  })

  it('revokes the preview on unmount', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { result, unmount } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    unmount()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('still uploads where object URLs are unavailable', async () => {
    createObjectURL.mockImplementation(() => {
      throw new TypeError('createObjectURL is unavailable here')
    })
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useImageUpload({ onUpload }))

    await act(async () => {
      await result.current.selectFile(buildFile())
    })

    expect(onUpload).toHaveBeenCalled()
    expect(result.current.previewUrl).toBeNull()
  })
})
