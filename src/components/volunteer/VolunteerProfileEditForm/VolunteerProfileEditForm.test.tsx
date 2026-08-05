import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VolunteerProfileEditForm from './VolunteerProfileEditForm'
import { updateCurrentUser } from '../../../services/api/userService'

vi.mock('../../../services/api/userService', () => ({
  updateCurrentUser: vi.fn(),
}))

const mockedUpdateCurrentUser = vi.mocked(updateCurrentUser)

const userProfile = {
    userId: 'user1',
    name: 'Coco Chocolate',
    email: 'coco@example.com',
    role: 'VOLUNTEER' as const,
    profileImageUrl: null,
}

describe('VolunteerProfileEditForm', () => {
    beforeEach(() => {
        mockedUpdateCurrentUser.mockReset()
    })

    it('shows the read-only name, email, and role by default', () => {
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        expect(screen.getByText('Coco Chocolate')).toBeInTheDocument()
        expect(screen.getByText('coco@example.com')).toBeInTheDocument()
        expect(screen.getByText('Volunteer')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('switches to an editable form pre-filled with the current values when Edit Profile is clicked', async () => {
        const user = userEvent.setup()
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        expect(screen.getByLabelText('Name')).toHaveValue('Coco Chocolate')
        expect(screen.getByLabelText('Email')).toHaveValue('coco@example.com')
    })

    it('never renders an editable input for role, even while editing', async () => {
        const user = userEvent.setup()
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument()
        expect(screen.getByText('Volunteer')).toBeInTheDocument()
    })

    it('shows a validation error and does not call the API when name is cleared', async () => {
        const user = userEvent.setup()
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.clear(screen.getByLabelText('Name'))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(screen.getByText('Name is required.')).toBeInTheDocument()
        expect(mockedUpdateCurrentUser).not.toHaveBeenCalled()
    })

    it('shows a validation error and does not call the API for an invalid email', async () => {
        const user = userEvent.setup()
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.clear(screen.getByLabelText('Email'))
        await user.type(screen.getByLabelText('Email'), 'not-an-email')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
        expect(mockedUpdateCurrentUser).not.toHaveBeenCalled()
    })

    it('saves the new name and email while preserving the existing role unchanged', async () => {
        const user = userEvent.setup()
        const onSaved = vi.fn()
        const updated = {
        ...userProfile,
        name: 'New Name',
        email: 'new@example.com',
        }
        mockedUpdateCurrentUser.mockResolvedValue(updated)

        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={onSaved}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.clear(screen.getByLabelText('Name'))
        await user.type(screen.getByLabelText('Name'), 'New Name')
        await user.clear(screen.getByLabelText('Email'))
        await user.type(screen.getByLabelText('Email'), 'new@example.com')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(mockedUpdateCurrentUser).toHaveBeenCalledWith('token', {
        name: 'New Name',
        email: 'new@example.com',
        role: 'VOLUNTEER',
        })
        expect(onSaved).toHaveBeenCalledWith(updated)
    })

    it('returns to the read-only view after a successful save', async () => {
        const user = userEvent.setup()
        mockedUpdateCurrentUser.mockResolvedValue(userProfile)

        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByRole('button', { name: /edit profile/i })).toBeInTheDocument()
    })

    it('discards changes and returns to the read-only view when Cancel is clicked', async () => {
        const user = userEvent.setup()
        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.clear(screen.getByLabelText('Name'))
        await user.type(screen.getByLabelText('Name'), 'Should Not Save')
        await user.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(screen.getByText('Coco Chocolate')).toBeInTheDocument()
        expect(screen.queryByText('Should Not Save')).not.toBeInTheDocument()
        expect(mockedUpdateCurrentUser).not.toHaveBeenCalled()
    })

    it('shows an error message and stays in edit mode when the save fails', async () => {
        const user = userEvent.setup()
        mockedUpdateCurrentUser.mockRejectedValue(new Error('Unable to update user profile: 500'))

        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(
        await screen.findByText('Unable to update user profile: 500'),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Name')).toBeInTheDocument()
    })

    it('disables the Save and Cancel buttons while a save is in flight', async () => {
        const user = userEvent.setup()
        let resolveSave: (value: typeof userProfile) => void = () => {}
        mockedUpdateCurrentUser.mockReturnValue(
        new Promise((resolve) => {
            resolveSave = resolve
        }),
        )

        render(
        <VolunteerProfileEditForm
            userProfile={userProfile}
            accessToken="token"
            onSaved={vi.fn()}
        />,
        )

        await user.click(screen.getByRole('button', { name: /edit profile/i }))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

        resolveSave(userProfile)
    })
})