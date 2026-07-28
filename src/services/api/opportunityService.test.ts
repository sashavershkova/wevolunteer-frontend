import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOpportunities } from './opportunityService'
import { mockOpportunities } from '../../tests/fixtures/opportunities'

describe('getOpportunities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed list of opportunities on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOpportunities),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOpportunities('test-token')

    expect(result).toEqual(mockOpportunities)
  })

  it('sends the access token as a bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getOpportunities('test-token')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/opportunities'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getOpportunities('test-token')).rejects.toThrow(
      'Unable to load opportunities: 500',
    )
  })
})