import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrganizationOpportunityDetailsPage from './OrganizationOpportunityDetailsPage'
import { useAppAuth } from '../../contexts/AuthContext'
import { closeOpportunity, getOpportunity } from '../../services/api/opportunityService'
import {
  attachOpportunityImage,
  uploadOpportunityImage,
} from '../../services/api/imageService'
import {
  getOrganizationOpportunityRegistrations,
  type Registration,
} from '../../services/api/registrationService'
import { opp1, opp2, opp7 } from '../../tests/fixtures/opportunities'
import type { Opportunity } from '../../types/Opportunity'

// opp1/opp2/opp7's dates (2026-06-28 through 2026-07-20) are fixed in the future relative
// to this mocked "today", so they exercise future-opportunity behavior deterministically
// regardless of when tests run.
const MOCKED_TODAY = '2026-01-01T00:00:00'

vi.mock('../../contexts/AuthContext', () => ({
  useAppAuth: vi.fn(),
}))

vi.mock('../../services/api/opportunityService', () => ({
  getOpportunity: vi.fn(),
  closeOpportunity: vi.fn(),
}))

vi.mock('../../services/api/registrationService', () => ({
  getOrganizationOpportunityRegistrations: vi.fn(),
}))

vi.mock('../../services/api/imageService', () => ({
  uploadOpportunityImage: vi.fn(),
  attachOpportunityImage: vi.fn(),
}))

const mockedUseAppAuth = vi.mocked(useAppAuth)
const mockedGetOpportunity = vi.mocked(getOpportunity)
const mockedCloseOpportunity = vi.mocked(closeOpportunity)
const mockedGetOrganizationOpportunityRegistrations = vi.mocked(
  getOrganizationOpportunityRegistrations,
)
const mockedUploadOpportunityImage = vi.mocked(uploadOpportunityImage)
const mockedAttachOpportunityImage = vi.mocked(attachOpportunityImage)

const registration1: Registration = {
  userId: 'user-1',
  opportunityId: opp1.opportunityId,
  title: opp1.title,
  date: opp1.date,
  location: opp1.location,
  organizationId: opp1.organizationId,
  organizationName: opp1.organizationName,
  registrationStatus: 'ACTIVE',
  volunteerName: 'Anna Johnson',
  email: 'anna@example.com',
  registeredAt: '2026-07-24T10:00:00',
}

const registration2: Registration = {
  userId: 'user-2',
  opportunityId: opp1.opportunityId,
  title: opp1.title,
  date: opp1.date,
  location: opp1.location,
  organizationId: opp1.organizationId,
  organizationName: opp1.organizationName,
  registrationStatus: 'ACTIVE',
  volunteerName: 'Michael Smith',
  email: 'michael@example.com',
  registeredAt: '2026-07-25T08:30:00',
}

const organizationFixture = {
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
    accessToken: 'test-token',
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

function renderPage(initialEntry = `/organization/opportunities/${opp1.opportunityId}`) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/organization/opportunities/:opportunityId"
          element={<OrganizationOpportunityDetailsPage />}
        />
        <Route path="/organization" element={<div>Organization Dashboard Page</div>} />
        <Route
          path="/organization/opportunities"
          element={<div>Organization Opportunities Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPageWithoutOpportunityId() {
  return render(
    <MemoryRouter>
      <OrganizationOpportunityDetailsPage />
    </MemoryRouter>,
  )
}

describe('OrganizationOpportunityDetailsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(MOCKED_TODAY))
    mockedGetOpportunity.mockReset()
    mockedCloseOpportunity.mockReset()
    mockedUploadOpportunityImage.mockReset()
    mockedAttachOpportunityImage.mockReset()
    mockedGetOrganizationOpportunityRegistrations.mockReset()
    mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])
    mockAuth()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading state while the opportunity is being fetched', () => {
    mockedGetOpportunity.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading opportunity...')
  })

  it('displays the loaded opportunity information', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(await screen.findByRole('heading', { name: opp1.title })).toBeInTheDocument()
    expect(screen.getByText(opp1.description)).toBeInTheDocument()
    expect(screen.getByText(opp1.category)).toBeInTheDocument()
    expect(screen.getByText(opp1.location)).toBeInTheDocument()
    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(mockedGetOpportunity).toHaveBeenCalledWith('test-token', opp1.opportunityId)
  })

  it('omits the time row when the opportunity has no time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp2)

    renderPage(`/organization/opportunities/${opp2.opportunityId}`)

    await screen.findByRole('heading', { name: opp2.title })

    expect(screen.queryByText('Time')).not.toBeInTheDocument()
  })

  it('shows the legacy time unchanged for an opportunity with only legacy time', async () => {
    mockedGetOpportunity.mockResolvedValue(opp7)

    renderPage(`/organization/opportunities/${opp7.opportunityId}`)

    await screen.findByRole('heading', { name: opp7.title })

    expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
  })

  it('shows capacity, registered count, and available spots', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    await screen.findByRole('heading', { name: opp1.title })

    expect(screen.getByText('Capacity').closest('div')).toHaveTextContent(String(opp1.capacity))
    expect(screen.getByText('Registered').closest('div')).toHaveTextContent(
      String(opp1.registeredCount),
    )
    expect(screen.getByText('Available Spots').closest('div')).toHaveTextContent(
      String(opp1.availableSpots),
    )
  })

  it('shows the empty image state with a working picker', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    await screen.findByRole('heading', { name: opp1.title })

    expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload Image')).toBeEnabled()
  })

  it('renders the opportunity image when one has been uploaded', async () => {
    mockedGetOpportunity.mockResolvedValue({
      ...opp1,
      imageUrl: 'https://s3.example.com/signed-get',
    })

    renderPage()

    expect(
      await screen.findByRole('img', { name: `${opp1.title} image` }),
    ).toHaveAttribute('src', 'https://s3.example.com/signed-get')
  })

  it('uploads and attaches a newly chosen image', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)
    mockedUploadOpportunityImage.mockResolvedValue(
      'organizations/org1/opportunities/1234.jpg',
    )
    mockedAttachOpportunityImage.mockResolvedValue({
      ...opp1,
      imageUrl: 'https://s3.example.com/signed-get',
    })

    renderPage()
    await screen.findByRole('heading', { name: opp1.title })

    const file = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Upload Image'), file)

    await waitFor(() => {
      expect(mockedAttachOpportunityImage).toHaveBeenCalledWith(
        'test-token',
        opp1.opportunityId,
        'organizations/org1/opportunities/1234.jpg',
      )
    })
    expect(
      await screen.findByRole('img', { name: `${opp1.title} image` }),
    ).toBeInTheDocument()
  })

  it('links the Edit control to the edit page with an accessible label', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    const editLink = await screen.findByRole('link', { name: `Edit ${opp1.title}` })
    expect(editLink).toHaveAttribute(
      'href',
      `/organization/opportunities/${opp1.opportunityId}/edit`,
    )
  })

  describe('Edit button visibility', () => {
    it('displays Edit for a future opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue({ ...opp1, date: '2026-08-01', status: 'OPEN' })

      renderPage()

      expect(
        await screen.findByRole('link', { name: `Edit ${opp1.title}` }),
      ).toBeInTheDocument()
    })

    it('does not display Edit for a past OPEN opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue({ ...opp1, date: '2025-06-01', status: 'OPEN' })

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      expect(
        screen.queryByRole('link', { name: `Edit ${opp1.title}` }),
      ).not.toBeInTheDocument()
    })

    it('does not display Edit for a past CLOSED opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue({ ...opp1, date: '2025-06-01', status: 'CLOSED' })

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      expect(
        screen.queryByRole('link', { name: `Edit ${opp1.title}` }),
      ).not.toBeInTheDocument()
    })
  })

  it('says "Back to My Opportunities" and routes to /organization/opportunities', async () => {
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    const backLink = await screen.findByRole('link', { name: /Back to My Opportunities/ })
    expect(backLink).toHaveAttribute('href', '/organization/opportunities')

    const user = userEvent.setup({ delay: null })
    await user.click(backLink)

    expect(await screen.findByText('Organization Opportunities Page')).toBeInTheDocument()
  })

  describe('Close Opportunity control', () => {
    const futureOpenOpportunity = { ...opp1, date: '2026-06-01', status: 'OPEN' as const }
    const todayOpenOpportunity = { ...opp1, date: '2026-01-01', status: 'OPEN' as const }
    const pastOpenOpportunity = { ...opp1, date: '2025-06-01', status: 'OPEN' as const }
    const closedOpportunity = { ...opp1, date: '2026-06-01', status: 'CLOSED' as const }

    it('shows Edit and Close Opportunity for an OPEN future opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)

      renderPage()

      expect(
        await screen.findByRole('link', { name: `Edit ${opp1.title}` }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Close Opportunity' }),
      ).toBeInTheDocument()
    })

    it('shows Close Opportunity for an OPEN opportunity dated today', async () => {
      mockedGetOpportunity.mockResolvedValue(todayOpenOpportunity)

      renderPage()

      expect(
        await screen.findByRole('button', { name: 'Close Opportunity' }),
      ).toBeInTheDocument()
    })

    it('does not show Close Opportunity for a past opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue(pastOpenOpportunity)

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      expect(
        screen.queryByRole('button', { name: 'Close Opportunity' }),
      ).not.toBeInTheDocument()
    })

    it('does not show Close Opportunity for an already CLOSED opportunity', async () => {
      mockedGetOpportunity.mockResolvedValue(closedOpportunity)

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      expect(
        screen.queryByRole('button', { name: 'Close Opportunity' }),
      ).not.toBeInTheDocument()
    })

    it('opens the confirmation prompt when Close Opportunity is clicked, without calling the API before confirmation', async () => {
      const user = userEvent.setup({ delay: null })
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      expect(confirmSpy).toHaveBeenCalledWith(
        'Closing this opportunity will cancel all active registrations and notify registered volunteers. This action cannot be undone.',
      )
      expect(mockedCloseOpportunity).not.toHaveBeenCalled()
    })

    it('does not call closeOpportunity when the confirmation is cancelled', async () => {
      const user = userEvent.setup({ delay: null })
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      expect(mockedCloseOpportunity).not.toHaveBeenCalled()
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close Opportunity' })).toBeInTheDocument()
    })

    it('calls closeOpportunity with the correct opportunity ID when confirmed', async () => {
      const user = userEvent.setup({ delay: null })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)
      mockedCloseOpportunity.mockResolvedValue({ ...futureOpenOpportunity, status: 'CLOSED' })

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      expect(mockedCloseOpportunity).toHaveBeenCalledWith(
        'test-token',
        futureOpenOpportunity.opportunityId,
      )
    })

    it('shows a Closing... loading state and prevents a duplicate submission while pending', async () => {
      const user = userEvent.setup({ delay: null })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)
      let resolveClose!: (value: Opportunity) => void
      mockedCloseOpportunity.mockReturnValue(
        new Promise((resolve) => {
          resolveClose = resolve
        }),
      )

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      const closingButton = await screen.findByRole('button', { name: 'Closing...' })
      expect(closingButton).toBeDisabled()

      await user.click(closingButton)
      expect(mockedCloseOpportunity).toHaveBeenCalledTimes(1)

      resolveClose({ ...futureOpenOpportunity, status: 'CLOSED' })
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Closing...' })).not.toBeInTheDocument()
      })
    })

    it('shows Closed and removes Close Opportunity immediately after a successful close, without a page refresh', async () => {
      const user = userEvent.setup({ delay: null })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)
      mockedCloseOpportunity.mockResolvedValue({
        ...futureOpenOpportunity,
        status: 'CLOSED',
        registeredCount: 0,
      })

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      expect(await screen.findByText('Closed')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Close Opportunity' }),
      ).not.toBeInTheDocument()
      expect(mockedGetOpportunity).toHaveBeenCalledTimes(1)
    })

    it('shows an error, keeps the opportunity Open, and restores the Close Opportunity control on failure', async () => {
      const user = userEvent.setup({ delay: null })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      mockedGetOpportunity.mockResolvedValue(futureOpenOpportunity)
      mockedCloseOpportunity.mockRejectedValue(
        new Error('Unable to close this opportunity: 500'),
      )

      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close Opportunity' }))

      expect(
        await screen.findByText('Unable to close this opportunity: 500'),
      ).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Close Opportunity' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close Opportunity' })).toBeEnabled()
    })
  })

  describe('registered volunteers section', () => {
    it('shows a loading state while registrations are being fetched', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockReturnValue(new Promise(() => {}))

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      expect(screen.getByText('Loading registered volunteers...')).toBeInTheDocument()
    })

    it('passes the accessToken and opportunityId to the API function', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])

      renderPage()

      await screen.findByRole('heading', { name: opp1.title })

      await waitFor(() => {
        expect(mockedGetOrganizationOpportunityRegistrations).toHaveBeenCalledWith(
          'test-token',
          opp1.opportunityId,
        )
      })
    })

    it('shows an empty state when nobody has registered', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([])

      renderPage()

      expect(
        await screen.findByText('No volunteers have registered for this opportunity yet.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Registered Volunteers' })).toBeInTheDocument()
    })

    it('shows the registration count and volunteer information when populated', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([
        registration1,
        registration2,
      ])

      renderPage()

      expect(
        await screen.findByRole('heading', { name: 'Registered Volunteers (2)' }),
      ).toBeInTheDocument()
      expect(screen.getByText('Anna Johnson')).toBeInTheDocument()
      expect(screen.getByText('anna@example.com')).toBeInTheDocument()
      expect(screen.getByText('Michael Smith')).toBeInTheDocument()
      expect(screen.getByText('michael@example.com')).toBeInTheDocument()
    })

    it('shows a readable status label instead of the raw backend value', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([registration1])

      renderPage()

      await screen.findByText('Anna Johnson')

      const statusCell = screen.getByText('Anna Johnson').closest('tr')?.querySelector(
        '[data-label="Status"]',
      )
      expect(statusCell).toHaveTextContent('Registered')
      expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument()
    })

    it('formats registeredAt into a readable local date', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockResolvedValue([registration1])

      renderPage()

      expect(await screen.findByText('Jul 24, 2026')).toBeInTheDocument()
    })

    it('shows an error state when loading registrations fails', async () => {
      mockedGetOpportunity.mockResolvedValue(opp1)
      mockedGetOrganizationOpportunityRegistrations.mockRejectedValue(
        new Error('Unable to load registered volunteers: 500'),
      )

      renderPage()

      expect(await screen.findByText('Unable to load registered volunteers: 500')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Registered Volunteers' })).toBeInTheDocument()
    })

    it('does not request registrations when the organization does not own the opportunity', async () => {
      mockAuth({
        organizationProfile: { ...organizationFixture, organizationId: 'org-other' },
      })
      mockedGetOpportunity.mockResolvedValue(opp1)

      renderPage()

      await screen.findByText('Your organization cannot view this opportunity.')

      expect(mockedGetOrganizationOpportunityRegistrations).not.toHaveBeenCalled()
    })
  })

  it('shows an error when loading the opportunity fails', async () => {
    mockedGetOpportunity.mockRejectedValue(new Error('Unable to load opportunity: 500'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load opportunity: 500',
    )
  })

  it('shows an error when the opportunity cannot be found', async () => {
    mockedGetOpportunity.mockResolvedValue(null)

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This opportunity could not be found.',
    )
  })

  it('shows an error and does not attempt to load when no opportunity ID is present', () => {
    renderPageWithoutOpportunityId()

    expect(screen.getByRole('alert')).toHaveTextContent('No opportunity was specified.')
    expect(mockedGetOpportunity).not.toHaveBeenCalled()
  })

  it('hides the details and shows a message when the organization does not own the opportunity', async () => {
    mockAuth({
      organizationProfile: { ...organizationFixture, organizationId: 'org-other' },
    })
    mockedGetOpportunity.mockResolvedValue(opp1)

    renderPage()

    expect(
      await screen.findByText('Your organization cannot view this opportunity.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: opp1.title })).not.toBeInTheDocument()
  })
})
