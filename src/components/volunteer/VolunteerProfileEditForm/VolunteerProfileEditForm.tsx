import { useState } from 'react'
import {
    updateCurrentUser,
    type UserProfile,
} from '../../../services/api/userService'
import { EditIcon } from '../../shared/icons'
import './VolunteerProfileEditForm.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormErrors = {
    name?: string
    email?: string
}

type VolunteerProfileEditFormProps = {
    userProfile: UserProfile
    accessToken: string
    onSaved: (updatedProfile: UserProfile) => void
}

function validate(name: string, email: string): FormErrors {
    const errors: FormErrors = {}

    if (!name.trim()) {
        errors.name = 'Name is required.'
    }

    if (!email.trim()) {
        errors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(email.trim())) {
        errors.email = 'Enter a valid email address.'
    }

    return errors
}

function VolunteerProfileEditForm({
    userProfile,
    accessToken,
    onSaved,
}: VolunteerProfileEditFormProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(userProfile.name)
    const [email, setEmail] = useState(userProfile.email)
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

    function startEditing() {
        setName(userProfile.name)
        setEmail(userProfile.email)
        setErrors({})
        setSaveErrorMessage(null)
        setIsEditing(true)
    }

    function cancelEditing() {
        setIsEditing(false)
        setErrors({})
        setSaveErrorMessage(null)
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        const validationErrors = validate(name, email)
        setErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
        return
        }

        setIsSaving(true)
        setSaveErrorMessage(null)

        try {
        const updated = await updateCurrentUser(accessToken, {
            name: name.trim(),
            email: email.trim(),
            // Never editable here - the backend ignores this value regardless,
            // but the current role is still sent since the request shape requires it.
            role: userProfile.role,
        })

        onSaved(updated)
        setIsEditing(false)
        } catch (error) {
        setSaveErrorMessage(
            error instanceof Error ? error.message : 'Unable to update your profile.',
        )
        } finally {
        setIsSaving(false)
        }
    }

    if (!isEditing) {
        return (
        <dl className="profile-details">
            <div className="profile-detail-row">
                <dt>Name</dt>
                <dd>{userProfile.name}</dd>
            </div>
            <div className="profile-detail-row">
                <dt>Email</dt>
                <dd>{userProfile.email}</dd>
            </div>
            <div className="profile-detail-row">
                <p className="profile-edit-form-role-label">Role</p>
                <p className="profile-edit-form-role-value">Volunteer</p>
            </div>

            <button
            type="button"
            className="profile-edit-button"
            onClick={startEditing}
            >
            <EditIcon aria-hidden="true" />
                Edit Profile
            </button>
        </dl>
        )
    }

    return (
        <form className="profile-edit-form" onSubmit={handleSubmit} noValidate>
        <div className="profile-edit-form-field">
            <label htmlFor="profile-name">Name</label>
            <input
            id="profile-name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'profile-name-error' : undefined}
            />
            {errors.name && (
            <p id="profile-name-error" className="profile-edit-form-error" role="alert">
                {errors.name}
            </p>
            )}
        </div>

        <div className="profile-edit-form-field">
            <label htmlFor="profile-email">Email</label>
            <input
            id="profile-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'profile-email-error' : undefined}
            />
            {errors.email && (
            <p id="profile-email-error" className="profile-edit-form-error" role="alert">
                {errors.email}
            </p>
            )}
        </div>

        <div className="profile-detail-row">
            <p className="profile-edit-form-role-label">Role</p>
            <p className="profile-edit-form-role-value">Volunteer</p>
        </div>

        {saveErrorMessage && (
            <p className="profile-edit-form-error" role="alert">
            {saveErrorMessage}
            </p>
        )}

        <div className="profile-edit-form-actions">
            <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
            type="button"
            className="profile-edit-form-cancel-button"
            disabled={isSaving}
            onClick={cancelEditing}
            >
                Cancel
            </button>
        </div>
        </form>
    )
}

export default VolunteerProfileEditForm