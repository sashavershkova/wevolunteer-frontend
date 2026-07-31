import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateCurrentOrganization } from './organizationService'

describe('updateCurrentOrganization', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const request = {
    name: 'Seattle Food Bank',
    description: 'We distribute food to local families.',
    email: 'contact@seattlefoodbank.org',
    website: 'https://seattlefoodbank.org',
    profileImageUrl: null,
  }

  const updatedOrganization = {
    organizationId: 'org1',
    ...request,
  }

  it('sends a PATCH request to the /organizations/me endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedOrganization),
    })
    vi.stubGlobal('fetch', fetchMock)

    await updateCurrentOrganization('test-token', request)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    )
  })

  it('sends the bearer token and JSON content type headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedOrganization),
    })
    vi.stubGlobal('fetch', fetchMock)

    await updateCurrentOrganization('test-token', request)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      }),
    )
  })

  it('serializes the request object as the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedOrganization),
    })
    vi.stubGlobal('fetch', fetchMock)

    await updateCurrentOrganization('test-token', request)

    const [, options] = fetchMock.mock.calls[0]
    const sentBody = JSON.parse(options.body)

    expect(sentBody).toEqual(request)
    expect(sentBody).not.toHaveProperty('organizationId')
  })

  it('returns the updated OrganizationProfile on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedOrganization),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await updateCurrentOrganization('test-token', request)

    expect(result).toEqual(updatedOrganization)
  })

  it('throws an error containing the status when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateCurrentOrganization('test-token', request)).rejects.toThrow(
      'Unable to update organization profile: 400',
    )
  })
})
