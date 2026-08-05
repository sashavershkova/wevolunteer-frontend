import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getMyWaitlist,
  getOrganizationOpportunityWaitlist,
  joinWaitlist,
  leaveWaitlist,
} from './waitlistService'

const waitlistFixture = {
  userId: 'user1',
  opportunityId: 'opp1',
  title: 'Food Bank Volunteer Shift',
  date: '2026-07-10',
  location: 'Seattle, WA',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  volunteerName: 'Sasha Vershkova',
  email: 'sasha@example.com',
  joinedAt: '2026-07-01T00:00:00',
}

describe('getMyWaitlist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed list of waitlist entries on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([waitlistFixture]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMyWaitlist('test-token')

    expect(result).toEqual([waitlistFixture])
  })

  it('calls the authenticated /waitlist/me endpoint with a bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getMyWaitlist('test-token')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/waitlist/me'),
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

    await expect(getMyWaitlist('test-token')).rejects.toThrow(
      'Unable to load your waitlist: 500',
    )
  })
})

describe('joinWaitlist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to /waitlist/me/{opportunityId} and returns the created entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(waitlistFixture),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await joinWaitlist('test-token', 'opp1')

    expect(result).toEqual(waitlistFixture)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/waitlist/me/opp1'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(joinWaitlist('test-token', 'opp1')).rejects.toThrow(
      'Unable to join the waitlist: 409',
    )
  })
})

describe('getOrganizationOpportunityWaitlist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the authenticated organization waitlist endpoint with a bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([waitlistFixture]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getOrganizationOpportunityWaitlist('test-token', 'opp 1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/me/opportunities/opp%201/waitlist'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('returns the parsed list of waitlist entries on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([waitlistFixture]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOrganizationOpportunityWaitlist('test-token', 'opp1')

    expect(result).toEqual([waitlistFixture])
  })

  it('returns an empty list when nobody is waiting', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOrganizationOpportunityWaitlist('test-token', 'opp1')

    expect(result).toEqual([])
  })

  it('throws an error containing the status when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      getOrganizationOpportunityWaitlist('test-token', 'opp1'),
    ).rejects.toThrow('Unable to load the waiting list: 403')
  })
})

describe('leaveWaitlist', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('DELETEs /waitlist/me/{opportunityId}', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await leaveWaitlist('test-token', 'opp1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/waitlist/me/opp1'),
      expect.objectContaining({
        method: 'DELETE',
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

    await expect(leaveWaitlist('test-token', 'opp1')).rejects.toThrow(
      'Unable to leave the waitlist: 500',
    )
  })
})
