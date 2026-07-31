import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  attachOpportunityImage,
  attachOrganizationProfileImage,
  attachUserProfileImage,
  createOpportunityImageUploadUrl,
  createOrganizationProfileImageUploadUrl,
  createUserProfileImageUploadUrl,
  uploadOpportunityImage,
  uploadOrganizationProfileImage,
  uploadToPresignedUrl,
  uploadUserProfileImage,
} from './imageService'
import { opp1 } from '../../tests/fixtures/opportunities'

const uploadUrlResponse = {
  objectKey: 'organizations/org1/opportunities/1234.jpg',
  uploadUrl: 'https://s3.example.com/signed-put',
  expiresInSeconds: 900,
}

function buildFile(type = 'image/jpeg'): File {
  return new File(['image-bytes'], 'photo.jpg', { type })
}

function okJson(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) }
}

describe('createOpportunityImageUploadUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the content type to the organization upload-url route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson(uploadUrlResponse))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createOpportunityImageUploadUrl('test-token', 'image/jpeg')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/opportunity-images/upload-url'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: 'image/jpeg' }),
      }),
    )
    expect(result).toEqual(uploadUrlResponse)
  })

  it('surfaces the message the backend sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: 'Unsupported image type. Allowed types are: image/jpeg.',
          }),
      }),
    )

    await expect(
      createOpportunityImageUploadUrl('test-token', 'image/gif'),
    ).rejects.toThrow('Unsupported image type. Allowed types are: image/jpeg.')
  })

  it('falls back to the status code when there is no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('not json')),
      }),
    )

    await expect(
      createOpportunityImageUploadUrl('test-token', 'image/jpeg'),
    ).rejects.toThrow('Unable to prepare the image upload: 500')
  })
})

describe('createUserProfileImageUploadUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts to the volunteer profile-image route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson(uploadUrlResponse))
    vi.stubGlobal('fetch', fetchMock)

    await createUserProfileImageUploadUrl('test-token', 'image/png')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/profile-image/upload-url'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/png' }),
      }),
    )
  })
})

describe('createOrganizationProfileImageUploadUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts to the organization profile-image route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson(uploadUrlResponse))
    vi.stubGlobal('fetch', fetchMock)

    await createOrganizationProfileImageUploadUrl('test-token', 'image/webp')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/profile-image/upload-url'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ contentType: 'image/webp' }),
      }),
    )
  })
})

describe('uploadToPresignedUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('PUTs the file with the signed content type and no bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const file = buildFile('IMAGE/JPEG; charset=utf-8')
    await uploadToPresignedUrl('https://s3.example.com/signed-put', file)

    expect(fetchMock).toHaveBeenCalledWith('https://s3.example.com/signed-put', {
      method: 'PUT',
      // Normalised to match what the backend signed; an Authorization header
      // here would invalidate the signature.
      headers: { 'Content-Type': 'image/jpeg' },
      body: file,
    })
  })

  it('throws when S3 rejects the upload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))

    await expect(
      uploadToPresignedUrl('https://s3.example.com/signed-put', buildFile()),
    ).rejects.toThrow('Unable to upload the image: 403')
  })
})

describe('uploadOpportunityImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests a URL, uploads to S3, and returns the object key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson(uploadUrlResponse))
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const objectKey = await uploadOpportunityImage('test-token', buildFile())

    expect(objectKey).toBe(uploadUrlResponse.objectKey)
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/organizations/me/opportunity-images/upload-url',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(uploadUrlResponse.uploadUrl)
  })

  it('does not attach anything: the opportunity may not exist yet', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson(uploadUrlResponse))
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    await uploadOpportunityImage('test-token', buildFile())

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('attachOpportunityImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('patches the opportunity image route with the object key', async () => {
    const updated = { ...opp1, imageUrl: 'https://s3.example.com/signed-get' }
    const fetchMock = vi.fn().mockResolvedValue(okJson(updated))
    vi.stubGlobal('fetch', fetchMock)

    const result = await attachOpportunityImage(
      'test-token',
      'opp 1',
      uploadUrlResponse.objectKey,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/opportunities/opp%201/image'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ objectKey: uploadUrlResponse.objectKey }),
      }),
    )
    expect(result).toEqual(updated)
  })

  it('surfaces the size limit message from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: 'The uploaded image is larger than the 5 MB limit.',
          }),
      }),
    )

    await expect(
      attachOpportunityImage('test-token', 'opp1', uploadUrlResponse.objectKey),
    ).rejects.toThrow('The uploaded image is larger than the 5 MB limit.')
  })
})

describe('attachUserProfileImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('patches the volunteer profile-image route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ userId: 'user1' }))
    vi.stubGlobal('fetch', fetchMock)

    await attachUserProfileImage('test-token', 'users/user1/profile/1234.jpg')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/profile-image'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ objectKey: 'users/user1/profile/1234.jpg' }),
      }),
    )
  })
})

describe('attachOrganizationProfileImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('patches the organization profile-image route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ organizationId: 'org1' }))
    vi.stubGlobal('fetch', fetchMock)

    await attachOrganizationProfileImage(
      'test-token',
      'organizations/org1/profile/1234.png',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/profile-image'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          objectKey: 'organizations/org1/profile/1234.png',
        }),
      }),
    )
  })
})

describe('uploadUserProfileImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads then attaches, returning the refreshed profile', async () => {
    const profile = {
      userId: 'user1',
      name: 'Sasha Vershkova',
      email: 'sasha@example.com',
      role: 'VOLUNTEER',
      profileImageUrl: 'https://s3.example.com/signed-get',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson(uploadUrlResponse))
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce(okJson(profile))
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadUserProfileImage('test-token', buildFile())

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result).toEqual(profile)
  })

  it('does not attach when the S3 upload fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson(uploadUrlResponse))
      .mockResolvedValueOnce({ ok: false, status: 403 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      uploadUserProfileImage('test-token', buildFile()),
    ).rejects.toThrow('Unable to upload the image: 403')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('uploadOrganizationProfileImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads then attaches, returning the refreshed organization', async () => {
    const organization = {
      organizationId: 'org1',
      name: 'Seattle Food Bank',
      description: '',
      email: 'org@example.com',
      website: '',
      profileImageUrl: 'https://s3.example.com/signed-get',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJson(uploadUrlResponse))
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce(okJson(organization))
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadOrganizationProfileImage('test-token', buildFile())

    expect(result).toEqual(organization)
  })
})
