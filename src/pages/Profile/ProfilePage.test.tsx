import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import { useAppAuth } from '../../contexts/AuthContext'
import { uploadUserProfileImage } from '../../services/api/imageService'
import { updateCurrentUser } from '../../services/api/userService'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/imageService', () => ({
  uploadUserProfileImage: vi.fn(),
}))

vi.mock('../../services/api/userService', () => ({
  updateCurrentUser: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedUploadUserProfileImage = vi.mocked(uploadUserProfileImage)
const mockedUpdateCurrentUser = vi.mocked(updateCurrentUser)

const volunteerProfile = {
  userId: 'user1',
  name: 'Coco Chocolate',
  email: 'coco@example.com',
  role: 'VOLUNTEER',
  profileImageUrl: null,
} as const

function imageFile() {
  return new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>>) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'coco@example.com',
    userId: 'user1',
    accessToken: 'token',
    userProfile: null,
    organizationProfile: null,
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

function renderProfilePage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/organization" element={<h1>Organization Dashboard</h1>} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockedUploadUserProfileImage.mockReset()
    mockedUpdateCurrentUser.mockReset()
  })

  it('displays the volunteer name, email, and role', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Coco Chocolate',
        email: 'coco@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderProfilePage()

    expect(screen.getByText('Coco Chocolate')).toBeInTheDocument()
    expect(screen.getByText('coco@example.com')).toBeInTheDocument()
    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('displays an avatar placeholder', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Coco Chocolate',
        email: 'coco@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderProfilePage()

    expect(screen.getByRole('img', { name: /coco chocolate avatar/i })).toBeInTheDocument()
    expect(screen.getByText('CC')).toBeInTheDocument()
  })

  describe('profile photo', () => {
    it('offers a photo picker limited to the accepted image types', () => {
      mockAuth({ userProfile: { ...volunteerProfile } })

      renderProfilePage()

      expect(screen.getByLabelText('Upload Photo')).toHaveAttribute(
        'accept',
        'image/jpeg,image/png,image/webp',
      )
    })

    it('shows the stored photo instead of the initials once one exists', () => {
      mockAuth({
        userProfile: {
          ...volunteerProfile,
          profileImageUrl: 'https://s3.example.com/signed-get',
        },
      })

      renderProfilePage()

      expect(
        screen.getByRole('img', { name: 'Coco Chocolate profile photo' }),
      ).toHaveAttribute('src', 'https://s3.example.com/signed-get')
      expect(screen.queryByText('CC')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Replace Photo')).toBeInTheDocument()
    })

    it('uploads the chosen photo and stores the refreshed profile', async () => {
      const updateUserProfile = vi.fn()
      const updatedProfile = {
        ...volunteerProfile,
        profileImageUrl: 'https://s3.example.com/signed-get',
      }
      mockAuth({ userProfile: { ...volunteerProfile }, updateUserProfile })
      mockedUploadUserProfileImage.mockResolvedValue(updatedProfile)

      renderProfilePage()

      const file = imageFile()
      await userEvent.upload(screen.getByLabelText('Upload Photo'), file)

      await waitFor(() => {
        expect(mockedUploadUserProfileImage).toHaveBeenCalledWith('token', file)
      })
      expect(updateUserProfile).toHaveBeenCalledWith(updatedProfile)
    })

    it('reports a failed upload and keeps the profile unchanged', async () => {
      const updateUserProfile = vi.fn()
      mockAuth({ userProfile: { ...volunteerProfile }, updateUserProfile })
      mockedUploadUserProfileImage.mockRejectedValue(
        new Error('The uploaded image is larger than the 5 MB limit.'),
      )

      renderProfilePage()

      await userEvent.upload(screen.getByLabelText('Upload Photo'), imageFile())

      expect(
        await screen.findByText('The uploaded image is larger than the 5 MB limit.'),
      ).toBeInTheDocument()
      expect(updateUserProfile).not.toHaveBeenCalled()
    })

    it('rejects an unsupported file without calling the API', async () => {
      mockAuth({ userProfile: { ...volunteerProfile } })

      renderProfilePage()

      // The accept attribute filters the file dialog, so the guard is exercised
      // the way a drag-and-drop or a stubborn browser would reach it.
      const input = screen.getByLabelText('Upload Photo') as HTMLInputElement
      input.removeAttribute('accept')
      await userEvent.upload(
        input,
        new File(['not-an-image'], 'notes.pdf', { type: 'application/pdf' }),
      )

      expect(
        await screen.findByText('Choose a JPEG, PNG, or WebP image.'),
      ).toBeInTheDocument()
      expect(mockedUploadUserProfileImage).not.toHaveBeenCalled()
    })
  })

  it('redirects to /organization for an organization profile', () => {
    mockAuth({
      organizationProfile: {
        organizationId: 'org1',
        name: 'Seattle Food Bank',
        description: '',
        email: '',
        website: '',
        profileImageUrl: null,
      },
    })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Organization Dashboard' })).toBeInTheDocument()
  })

  it('shows a loading state while profile data loads', () => {
    mockAuth({ isProfileLoading: true })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: /loading your profile/i })).toBeInTheDocument()
  })

  it('shows the About Me placeholder card', () => {
    mockAuth({ userProfile: { ...volunteerProfile } })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'About Me' })).toBeInTheDocument()
    expect(
      screen.getByText(/I love volunteering at local pet shelters/),
    ).toBeInTheDocument()
  })

  it('shows the Complete Your Profile checklist', () => {
    mockAuth({ userProfile: { ...volunteerProfile } })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Complete Your Profile' })).toBeInTheDocument()
  })

  it('no longer shows the removed Volunteer Activity metrics', () => {
    mockAuth({ userProfile: { ...volunteerProfile } })

    renderProfilePage()

    expect(screen.queryByText('Your Volunteer Activity')).not.toBeInTheDocument()
    expect(screen.queryByText('Upcoming Opportunities')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed Opportunities')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Registrations')).not.toBeInTheDocument()
  })

  describe('profile editing', () => {
    it('offers an Edit Profile control', () => {
      mockAuth({ userProfile: { ...volunteerProfile } })

      renderProfilePage()

      expect(
        screen.getByRole('button', { name: /edit profile/i }),
      ).toBeInTheDocument()
    })

    it('shows editable name and email fields once Edit Profile is clicked', async () => {
      const user = userEvent.setup()
      mockAuth({ userProfile: { ...volunteerProfile } })

      renderProfilePage()

      await user.click(screen.getByRole('button', { name: /edit profile/i }))

      expect(screen.getByLabelText('Name')).toHaveValue('Coco Chocolate')
      expect(screen.getByLabelText('Email')).toHaveValue('coco@example.com')
    })

    it('updates the auth context profile once a save succeeds', async () => {
      const user = userEvent.setup()
      const updateUserProfile = vi.fn()
      const updated = { ...volunteerProfile, name: 'New Name' }
      mockAuth({ userProfile: { ...volunteerProfile }, updateUserProfile })
      mockedUpdateCurrentUser.mockResolvedValue(updated)

      renderProfilePage()

      await user.click(screen.getByRole('button', { name: /edit profile/i }))
      await user.clear(screen.getByLabelText('Name'))
      await user.type(screen.getByLabelText('Name'), 'New Name')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(updateUserProfile).toHaveBeenCalledWith(updated)
      })
    })
  })
})