import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import { useAppAuth } from '../../contexts/AuthContext'
import { uploadUserProfileImage } from '../../services/api/imageService'
import {
  getMyRegistrations,
  type Registration,
} from '../../services/api/registrationService'

const MOCKED_TODAY = '2026-07-29T12:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getMyRegistrations: vi.fn(),
}))

vi.mock('../../services/api/imageService', () => ({
  uploadUserProfileImage: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations)
const mockedUploadUserProfileImage = vi.mocked(uploadUserProfileImage)

const volunteerProfile = {
  userId: 'user1',
  name: 'Sasha Vershkova',
  email: 'sasha@example.com',
  role: 'VOLUNTEER',
  profileImageUrl: null,
} as const

function imageFile() {
  return new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

function buildRegistration(overrides: Partial<Registration>): Registration {
  return {
    userId: 'user1',
    opportunityId: 'opp-1',
    title: 'Beach Cleanup',
    date: '2026-08-01',
    location: 'Seattle, WA',
    organizationId: 'org-1',
    organizationName: 'Green Earth',
    registrationStatus: 'ACTIVE',
    volunteerName: 'Sasha Vershkova',
    email: 'sasha@example.com',
    registeredAt: '2026-07-24T10:00:00',
    ...overrides,
  }
}

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>>) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    errorMessage: null,
    email: 'sasha@example.com',
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
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetMyRegistrations.mockReset()
    mockedGetMyRegistrations.mockResolvedValue([])
    mockedUploadUserProfileImage.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays the volunteer name, email, and role', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.getByText('Sasha Vershkova')).toBeInTheDocument()
    expect(screen.getByText('sasha@example.com')).toBeInTheDocument()
    expect(screen.getByText('Volunteer')).toBeInTheDocument()
  })

  it('displays an avatar placeholder', () => {
    mockAuth({
      userProfile: {
        userId: 'user1',
        name: 'Sasha Vershkova',
        email: 'sasha@example.com',
        role: 'VOLUNTEER',
        profileImageUrl: null,
      },
    })

    renderProfilePage()

    expect(screen.getByRole('img', { name: /sasha vershkova avatar/i })).toBeInTheDocument()
    expect(screen.getByText('SV')).toBeInTheDocument()
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
        screen.getByRole('img', { name: 'Sasha Vershkova profile photo' }),
      ).toHaveAttribute('src', 'https://s3.example.com/signed-get')
      expect(screen.queryByText('SV')).not.toBeInTheDocument()
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

  describe('Your Volunteer Activity', () => {
    function mockVolunteer() {
      mockAuth({
        userProfile: {
          userId: 'user1',
          name: 'Sasha Vershkova',
          email: 'sasha@example.com',
          role: 'VOLUNTEER',
          profileImageUrl: null,
        },
      })
    }

    it('shows a loading message while registrations are pending', () => {
      mockVolunteer()
      mockedGetMyRegistrations.mockReturnValue(new Promise(() => {}))

      renderProfilePage()

      expect(screen.getByText('Loading activity...')).toBeInTheDocument()
    })

    it('calculates upcoming, completed, and total counts correctly', async () => {
      mockVolunteer()
      mockedGetMyRegistrations.mockResolvedValue([
        buildRegistration({ opportunityId: 'opp-past-1', date: '2026-07-19' }),
        buildRegistration({ opportunityId: 'opp-past-2', date: '2026-06-01' }),
        buildRegistration({ opportunityId: 'opp-future-1', date: '2026-08-01' }),
        buildRegistration({ opportunityId: 'opp-future-2', date: '2026-09-15' }),
        buildRegistration({ opportunityId: 'opp-future-3', date: '2026-12-25' }),
        buildRegistration({ opportunityId: 'opp-future-4', date: '2027-01-01' }),
      ])

      renderProfilePage()

      await screen.findByText('Your Volunteer Activity')

      expect(
        screen.getByText('Upcoming Opportunities').previousElementSibling,
      ).toHaveTextContent('4')
      expect(
        screen.getByText('Completed Opportunities').previousElementSibling,
      ).toHaveTextContent('2')
      expect(
        screen.getByText('Total Registrations').previousElementSibling,
      ).toHaveTextContent('6')
    })

    it('counts a registration dated today as Upcoming, not Completed', async () => {
      mockVolunteer()
      mockedGetMyRegistrations.mockResolvedValue([
        buildRegistration({ opportunityId: 'opp-today', date: '2026-07-29' }),
      ])

      renderProfilePage()

      await screen.findByText('Your Volunteer Activity')

      expect(
        screen.getByText('Upcoming Opportunities').previousElementSibling,
      ).toHaveTextContent('1')
      expect(
        screen.getByText('Completed Opportunities').previousElementSibling,
      ).toHaveTextContent('0')
    })

    it('displays 0 for all three metrics when there are no registrations', async () => {
      mockVolunteer()
      mockedGetMyRegistrations.mockResolvedValue([])

      renderProfilePage()

      await screen.findByText('Your Volunteer Activity')

      expect(
        screen.getByText('Upcoming Opportunities').previousElementSibling,
      ).toHaveTextContent('0')
      expect(
        screen.getByText('Completed Opportunities').previousElementSibling,
      ).toHaveTextContent('0')
      expect(
        screen.getByText('Total Registrations').previousElementSibling,
      ).toHaveTextContent('0')
    })

    it('shows a friendly error and keeps profile details visible when loading fails', async () => {
      mockVolunteer()
      mockedGetMyRegistrations.mockRejectedValue(
        new Error('Unable to load registrations: 500'),
      )

      renderProfilePage()

      expect(
        await screen.findByText('Unable to load your volunteer activity.'),
      ).toBeInTheDocument()

      expect(
        screen.queryByText('Unable to load registrations: 500'),
      ).not.toBeInTheDocument()

      expect(screen.getByText('Sasha Vershkova')).toBeInTheDocument()
      expect(screen.getByText('sasha@example.com')).toBeInTheDocument()
      expect(screen.getByLabelText('Upload Photo')).toBeEnabled()
    })
  })
})
