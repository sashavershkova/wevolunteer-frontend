import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMyFavorites, removeFavorite, saveFavorite } from './favoriteService'

const favoriteFixture = {
  userId: 'user1',
  opportunityId: 'opp1',
  title: 'Food Bank Volunteer Shift',
  date: '2026-07-10',
  location: 'Seattle, WA',
  organizationId: 'org1',
  organizationName: 'Seattle Food Bank',
  favoritedAt: '2026-07-01T00:00:00',
}

describe('getMyFavorites', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed list of favorites on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([favoriteFixture]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMyFavorites('test-token')

    expect(result).toEqual([favoriteFixture])
  })

  it('calls the authenticated /favorites/me endpoint with a bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getMyFavorites('test-token')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/favorites/me'),
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

    await expect(getMyFavorites('test-token')).rejects.toThrow(
      'Unable to load favorites: 500',
    )
  })
})

describe('saveFavorite', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs to /favorites/me/{opportunityId} and returns the saved favorite', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(favoriteFixture),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await saveFavorite('test-token', 'opp1')

    expect(result).toEqual(favoriteFixture)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/favorites/me/opp1'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(saveFavorite('test-token', 'opp1')).rejects.toThrow(
      'Unable to save this opportunity: 404',
    )
  })
})

describe('removeFavorite', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('DELETEs /favorites/me/{opportunityId}', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await removeFavorite('test-token', 'opp1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/favorites/me/opp1'),
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

    await expect(removeFavorite('test-token', 'opp1')).rejects.toThrow(
      'Unable to remove this favorite: 500',
    )
  })
})
