import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOrganizationOpportunityRegistrations, type Registration } from './registrationService'

describe('getOrganizationOpportunityRegistrations', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const registrations: Registration[] = [
    {
      userId: 'user-1',
      opportunityId: 'opp 1',
      title: 'Beach Cleanup',
      date: '2026-08-01',
      location: 'Seattle, WA',
      organizationId: 'org-1',
      organizationName: 'Green Earth',
      registrationStatus: 'ACTIVE',
      volunteerName: 'Anna Johnson',
      email: 'anna@example.com',
      registeredAt: '2026-07-24T10:00:00',
    },
  ]

  it('sends a GET request to the organization-scoped registrations endpoint with the encoded opportunityId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(registrations),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getOrganizationOpportunityRegistrations('test-token', 'opp 1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/opportunities/opp%201/registrations'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('does not send a method override (defaults to GET)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(registrations),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getOrganizationOpportunityRegistrations('test-token', 'opp-1')

    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBeUndefined()
  })

  it('returns the parsed list of registrations on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(registrations),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOrganizationOpportunityRegistrations('test-token', 'opp-1')

    expect(result).toEqual(registrations)
  })

  it('returns an empty list when nobody has registered', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOrganizationOpportunityRegistrations('test-token', 'opp-1')

    expect(result).toEqual([])
  })

  it('throws an error containing the status when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getOrganizationOpportunityRegistrations('test-token', 'opp-1'),
    ).rejects.toThrow('Unable to load registered volunteers: 403')
  })

  it('throws rather than silently returning an empty list on a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getOrganizationOpportunityRegistrations('test-token', 'opp-1'),
    ).rejects.toThrow('Unable to load registered volunteers: 404')
  })
})
