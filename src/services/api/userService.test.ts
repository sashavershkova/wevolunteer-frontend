import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateCurrentUser } from './userService'

describe('updateCurrentUser', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    const request = {
        name: 'Coco Chocolate',
        email: 'coco@example.com',
        role: 'VOLUNTEER' as const,
    }

    const updatedUser = {
        userId: 'user1',
        profileImageUrl: null,
        ...request,
    }

    it('sends a PATCH request to the /users/me endpoint', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser),
        })
        vi.stubGlobal('fetch', fetchMock)

        await updateCurrentUser('test-token', request)

        expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
            method: 'PATCH',
        }),
        )
    })

    it('sends the bearer token and JSON content type headers', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser),
        })
        vi.stubGlobal('fetch', fetchMock)

        await updateCurrentUser('test-token', request)

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

    it('sends the request body as JSON', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser),
        })
        vi.stubGlobal('fetch', fetchMock)

        await updateCurrentUser('test-token', request)

        expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
            body: JSON.stringify(request),
        }),
        )
    })

    it('returns the updated profile from the response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser),
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await updateCurrentUser('test-token', request)

        expect(result).toEqual(updatedUser)
    })

    it('throws with the response status when the request fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        })
        vi.stubGlobal('fetch', fetchMock)

        await expect(updateCurrentUser('test-token', request)).rejects.toThrow(
        'Unable to update user profile: 500',
        )
    })
})