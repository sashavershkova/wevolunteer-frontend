import { env } from '../../config/env'
import { normalizeImageContentType } from '../../utils/imageFile'
import type { Opportunity } from '../../types/Opportunity'
import type { OrganizationProfile } from './organizationService'
import type { UserProfile } from './userService'

/**
 * Image uploads never send bytes through our API. The browser asks for a
 * short-lived pre-signed URL, PUTs the file straight to S3, then tells the API
 * which object to keep. Issuing a URL is not proof that the upload finished, so
 * nothing is stored until that second call.
 */

/** Temporary permission to upload exactly one image. */
export type ImageUploadUrl = {
  objectKey: string
  uploadUrl: string
  expiresInSeconds: number
}

/**
 * Prefers the backend's own message: the image endpoints return specific,
 * user-ready text ("The uploaded image is larger than the 5 MB limit.") that is
 * more useful than a bare status code.
 */
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string' &&
      (body as { message: string }).message.trim()
    ) {
      return (body as { message: string }).message
    }
  } catch {
    // No JSON body, or an unreadable one - fall through to the generic message.
  }

  return `${fallback}: ${response.status}`
}

async function requestUploadUrl(
  accessToken: string,
  path: string,
  contentType: string,
): Promise<ImageUploadUrl> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contentType }),
  })

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Unable to prepare the image upload'),
    )
  }

  return response.json() as Promise<ImageUploadUrl>
}

/**
 * Sends the file to S3.
 *
 * <p>No Authorization header: the signature in the URL is the credential, and an
 * extra header would invalidate it. The Content-Type must match the type the
 * backend signed, or S3 rejects the PUT.
 */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': normalizeImageContentType(file.type),
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Unable to upload the image: ${response.status}`)
  }
}

export function createOpportunityImageUploadUrl(
  accessToken: string,
  contentType: string,
): Promise<ImageUploadUrl> {
  return requestUploadUrl(
    accessToken,
    '/organizations/me/opportunity-images/upload-url',
    contentType,
  )
}

export function createUserProfileImageUploadUrl(
  accessToken: string,
  contentType: string,
): Promise<ImageUploadUrl> {
  return requestUploadUrl(
    accessToken,
    '/users/me/profile-image/upload-url',
    contentType,
  )
}

export function createOrganizationProfileImageUploadUrl(
  accessToken: string,
  contentType: string,
): Promise<ImageUploadUrl> {
  return requestUploadUrl(
    accessToken,
    '/organizations/me/profile-image/upload-url',
    contentType,
  )
}

async function attach<T>(
  accessToken: string,
  path: string,
  objectKey: string,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objectKey }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage))
  }

  return response.json() as Promise<T>
}

export function attachOpportunityImage(
  accessToken: string,
  opportunityId: string,
  objectKey: string,
): Promise<Opportunity> {
  return attach<Opportunity>(
    accessToken,
    `/organizations/me/opportunities/${encodeURIComponent(opportunityId)}/image`,
    objectKey,
    'Unable to save this opportunity image',
  )
}

export function attachUserProfileImage(
  accessToken: string,
  objectKey: string,
): Promise<UserProfile> {
  return attach<UserProfile>(
    accessToken,
    '/users/me/profile-image',
    objectKey,
    'Unable to save your profile photo',
  )
}

export function attachOrganizationProfileImage(
  accessToken: string,
  objectKey: string,
): Promise<OrganizationProfile> {
  return attach<OrganizationProfile>(
    accessToken,
    '/organizations/me/profile-image',
    objectKey,
    'Unable to save your organization logo',
  )
}

/**
 * Uploads an opportunity image and returns its object key.
 *
 * <p>Stops short of attaching it: an opportunity being created does not exist
 * yet, so the caller decides when to attach - immediately when editing, or after
 * the create request succeeds.
 */
export async function uploadOpportunityImage(
  accessToken: string,
  file: File,
): Promise<string> {
  const { objectKey, uploadUrl } = await createOpportunityImageUploadUrl(
    accessToken,
    normalizeImageContentType(file.type),
  )

  await uploadToPresignedUrl(uploadUrl, file)

  return objectKey
}

/** Uploads and attaches in one step: the volunteer profile always exists. */
export async function uploadUserProfileImage(
  accessToken: string,
  file: File,
): Promise<UserProfile> {
  const { objectKey, uploadUrl } = await createUserProfileImageUploadUrl(
    accessToken,
    normalizeImageContentType(file.type),
  )

  await uploadToPresignedUrl(uploadUrl, file)

  return attachUserProfileImage(accessToken, objectKey)
}

/** Uploads and attaches in one step: the organization profile always exists. */
export async function uploadOrganizationProfileImage(
  accessToken: string,
  file: File,
): Promise<OrganizationProfile> {
  const { objectKey, uploadUrl } =
    await createOrganizationProfileImageUploadUrl(
      accessToken,
      normalizeImageContentType(file.type),
    )

  await uploadToPresignedUrl(uploadUrl, file)

  return attachOrganizationProfileImage(accessToken, objectKey)
}
