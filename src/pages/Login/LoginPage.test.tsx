import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'
import { useAppAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)

function mockAuth(overrides: Partial<ReturnType<typeof useAppAuth>> = {}) {
  mockedUseAppAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    errorMessage: null,
    email: '',
    userId: '',
    accessToken: '',
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

describe('LoginPage', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('displays the WeVolunteer branding', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: 'WeVolunteer' })).toBeInTheDocument()
  })

  it('calls auth.signIn when the Sign in button is clicked', async () => {
    const signIn = vi.fn()
    mockAuth({ signIn })
    const user = userEvent.setup()

    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('calls auth.signUp when the Sign up button is clicked', async () => {
    const signUp = vi.fn()
    mockAuth({ signUp })
    const user = userEvent.setup()

    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(signUp).toHaveBeenCalledTimes(1)
  })

  it('exposes sign in and sign up as accessible buttons', () => {
    render(<LoginPage />)

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
  })
})
