import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeOpportunity, createOpportunity, getOpportunities } from './opportunityService'
import { mockOpportunities, opp1 } from '../../tests/fixtures/opportunities'

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

describe('closeOpportunity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a PATCH request to the close endpoint with the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...opp1, status: 'CLOSED' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await closeOpportunity('test-token', 'opp1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/opportunities/opp1/close'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('returns the parsed, updated Opportunity on success', async () => {
    const closedOpportunity = { ...opp1, status: 'CLOSED' as const }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(closedOpportunity),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await closeOpportunity('test-token', 'opp1')

    expect(result).toEqual(closedOpportunity)
  })

  it('throws an error containing the status when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(closeOpportunity('test-token', 'opp1')).rejects.toThrow(
      'Unable to close this opportunity: 403',
    )
  })
})

describe('createOpportunity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const request = {
    opportunityId: 'opp1',
    title: 'Food Bank Volunteer Shift',
    description: 'Help sort and package food donations for local families in need.',
    category: 'Food',
    location: 'Seattle, WA',
    date: '2026-07-10',
    capacity: 10,
  }

  it('sends a POST request to the organization opportunities endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(opp1),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createOpportunity('test-token', request)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/opportunities'),
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('sends the bearer token and JSON content type headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(opp1),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createOpportunity('test-token', request)

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

  it('serializes the request object as the body, without organizationId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(opp1),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createOpportunity('test-token', request)

    const [, options] = fetchMock.mock.calls[0]
    const sentBody = JSON.parse(options.body)

    expect(sentBody).toEqual(request)
    expect(sentBody).not.toHaveProperty('organizationId')
    expect(sentBody).not.toHaveProperty('organizationName')
  })

  it('returns the created Opportunity on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(opp1),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createOpportunity('test-token', request)

    expect(result).toEqual(opp1)
  })

  it('throws an error containing the status when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(createOpportunity('test-token', request)).rejects.toThrow(
      'Unable to create this opportunity: 400',
    )
  })
})