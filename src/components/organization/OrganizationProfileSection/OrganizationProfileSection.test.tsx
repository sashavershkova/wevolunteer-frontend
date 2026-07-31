import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationProfileSection from './OrganizationProfileSection'
import { useAppAuth } from '../../../contexts/AuthContext'
import {
  updateCurrentOrganization,
  type OrganizationProfile,
} from '../../../services/api/organizationService'
import { uploadOrganizationProfileImage } from '../../../services/api/imageService'

vi.mock('../../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../../services/api/organizationService', () => ({
  updateCurrentOrganization: vi.fn(),
}))

vi.mock('../../../services/api/imageService', () => ({
  uploadOrganizationProfileImage: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedUpdateCurrentOrganization = vi.mocked(updateCurrentOrganization)
const mockedUploadOrganizationProfileImage = vi.mocked(uploadOrganizationProfileImage)

const organizationFixture: OrganizationProfile = {
  organizationId: 'org1',
  name: 'Seattle Food Bank',
  description: 'We distribute food to local families.',
  email: 'contact@seattlefoodbank.org',
  website: '',
  profileImageUrl: null,
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'org@example.com',
    userId: 'org1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: organizationFixture,
    isProfileLoading: false,
    isProfileInitialized: true,
    profileErrorMessage: null,
    updateUserProfile: vi.fn(),
    updateOrganizationProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  })
}

function renderSection(overrides: Partial<typeof organizationFixture> = {}) {
  return render(
    <OrganizationProfileSection organization={{ ...organizationFixture, ...overrides }} />,
  )
}

function enterEditMode() {
  fireEvent.click(screen.getByRole('button', { name: 'Edit organization information' }))
}

describe('OrganizationProfileSection', () => {
  beforeEach(() => {
    mockedUpdateCurrentOrganization.mockReset()
    mockedUploadOrganizationProfileImage.mockReset()
    mockAuth()
  })

  it('shows the organization name and description in display mode', () => {
    renderSection()

    expect(
      screen.getByRole('heading', { name: organizationFixture.name }),
    ).toBeInTheDocument()
    expect(screen.getByText(organizationFixture.description)).toBeInTheDocument()
    expect(screen.getByText(organizationFixture.email)).toBeInTheDocument()
  })

  it('shows the edit icon with an accessible name', () => {
    renderSection()

    expect(
      screen.getByRole('button', { name: 'Edit organization information' }),
    ).toBeInTheDocument()
  })

  it('shows prepopulated fields when the edit icon is clicked', () => {
    renderSection()
    enterEditMode()

    expect(screen.getByLabelText('Organization name')).toHaveValue(organizationFixture.name)
    expect(screen.getByLabelText('Description')).toHaveValue(organizationFixture.description)
    expect(screen.getByLabelText('Email')).toHaveValue(organizationFixture.email)
    expect(screen.getByLabelText('Website')).toHaveValue(organizationFixture.website)
  })

  it('Cancel restores display mode without calling the API', () => {
    renderSection()
    enterEditMode()

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Changed Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: organizationFixture.name })).toBeInTheDocument()
    expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
  })

  it('Save calls updateCurrentOrganization with the access token and edited field values', async () => {
    mockedUpdateCurrentOrganization.mockResolvedValue({
      ...organizationFixture,
      name: 'Updated Food Bank',
    })

    renderSection()
    enterEditMode()

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Updated Food Bank' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockedUpdateCurrentOrganization).toHaveBeenCalledWith('token', {
        name: 'Updated Food Bank',
        description: organizationFixture.description,
        email: organizationFixture.email,
        website: organizationFixture.website,
      })
    })
  })

  it('calls updateOrganizationProfile after a successful save', async () => {
    const updateOrganizationProfile = vi.fn()
    mockAuth({ updateOrganizationProfile })
    const updatedOrganization = { ...organizationFixture, name: 'Updated Food Bank' }
    mockedUpdateCurrentOrganization.mockResolvedValue(updatedOrganization)

    renderSection()
    enterEditMode()

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Updated Food Bank' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(updateOrganizationProfile).toHaveBeenCalledWith(updatedOrganization)
    })
  })

  it('returns to display mode after a successful save', async () => {
    mockedUpdateCurrentOrganization.mockResolvedValue({
      ...organizationFixture,
      name: 'Updated Food Bank',
    })

    renderSection()
    enterEditMode()

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Updated Food Bank' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
    })
  })

  it('shows an error and keeps the form open when the update fails', async () => {
    mockedUpdateCurrentOrganization.mockRejectedValue(
      new Error('Unable to update organization profile: 500'),
    )

    renderSection()
    enterEditMode()

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to update organization profile: 500',
    )
    expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
  })

  it('disables Save and Cancel while submitting', async () => {
    let resolveUpdate: (value: typeof organizationFixture) => void = () => {}
    mockedUpdateCurrentOrganization.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      }),
    )

    renderSection()
    enterEditMode()

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    resolveUpdate(organizationFixture)

    await waitFor(() => {
      expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument()
    })
  })

  it('shows an understandable error when the access token is missing', async () => {
    mockAuth({ accessToken: '' })

    renderSection()
    enterEditMode()

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('Your authentication session is unavailable.'),
    ).toBeInTheDocument()
    expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
  })

  it('prevents the API request when name and email are blank', async () => {
    renderSection()
    enterEditMode()

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Organization name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(mockedUpdateCurrentOrganization).not.toHaveBeenCalled()
  })

  it('renders the organization name as an h1 when headingLevel is h1', () => {
    render(<OrganizationProfileSection organization={organizationFixture} headingLevel="h1" />)

    expect(
      screen.getByRole('heading', { level: 1, name: organizationFixture.name }),
    ).toBeInTheDocument()
  })
})

describe('OrganizationProfileSection - logo', () => {
  beforeEach(() => {
    mockedUploadOrganizationProfileImage.mockReset()
    mockAuth()
  })

  function logoFile() {
    return new File(['image-bytes'], 'logo.png', { type: 'image/png' })
  }

  it('offers a logo picker limited to the accepted image types', () => {
    renderSection()

    expect(screen.getByLabelText('Upload logo')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    )
  })

  it('shows the stored logo and offers to replace it', () => {
    renderSection({ profileImageUrl: 'https://s3.example.com/signed-get' })

    expect(
      screen.getByRole('img', { name: `${organizationFixture.name} logo` }),
    ).toHaveAttribute('src', 'https://s3.example.com/signed-get')
    expect(screen.getByLabelText('Replace logo')).toBeInTheDocument()
  })

  it('uploads the chosen logo and stores the refreshed organization', async () => {
    const updateOrganizationProfile = vi.fn()
    const updated = {
      ...organizationFixture,
      profileImageUrl: 'https://s3.example.com/signed-get',
    }
    mockAuth({ updateOrganizationProfile })
    mockedUploadOrganizationProfileImage.mockResolvedValue(updated)

    renderSection()

    const file = logoFile()
    await userEvent.upload(screen.getByLabelText('Upload logo'), file)

    await waitFor(() => {
      expect(mockedUploadOrganizationProfileImage).toHaveBeenCalledWith('token', file)
    })
    expect(updateOrganizationProfile).toHaveBeenCalledWith(updated)
  })

  it('reports a failed logo upload', async () => {
    const updateOrganizationProfile = vi.fn()
    mockAuth({ updateOrganizationProfile })
    mockedUploadOrganizationProfileImage.mockRejectedValue(
      new Error('The uploaded file is not a supported image.'),
    )

    renderSection()

    await userEvent.upload(screen.getByLabelText('Upload logo'), logoFile())

    expect(
      await screen.findByText('The uploaded file is not a supported image.'),
    ).toBeInTheDocument()
    expect(updateOrganizationProfile).not.toHaveBeenCalled()
  })
})
