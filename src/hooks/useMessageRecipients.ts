import { useEffect, useState } from 'react'
import { getMyOrganizationOpportunities } from '../services/api/organizationService'
import {
  getMyRegistrations,
  getOrganizationOpportunityRegistrations,
} from '../services/api/registrationService'
import type { MessagingRecipient } from '../components/messages/MessagingView/MessagingView'

type RecipientsState = {
  recipients: MessagingRecipient[]
  isLoading: boolean
}

/**
 * The organizations a volunteer may open a conversation with.
 *
 * <p>Technically the backend lets a volunteer message any organization, but a free-text search
 * over every organization is a bigger surface than this screen needs. The ones they have
 * registered with are the ones they actually have something to ask about, and it costs a
 * single request they are already entitled to make.
 */
export function useVolunteerMessageRecipients(accessToken: string): RecipientsState {
  const [recipients, setRecipients] = useState<MessagingRecipient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const load = async () => {
      setIsLoading(true)

      try {
        const registrations = await getMyRegistrations(accessToken)

        if (ignore) {
          return
        }

        const byOrganizationId = new Map<string, MessagingRecipient>()

        registrations.forEach((registration) => {
          if (registration.organizationId && !byOrganizationId.has(registration.organizationId)) {
            byOrganizationId.set(registration.organizationId, {
              id: registration.organizationId,
              name: registration.organizationName || 'Organization',
            })
          }
        })

        setRecipients(
          Array.from(byOrganizationId.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
      } catch {
        // A recipient list that fails to load leaves the compose picker empty with its own
        // explanatory message. It is not worth an error banner over the whole page, which
        // still works fine for replying to existing threads.
        if (!ignore) {
          setRecipients([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [accessToken])

  return { recipients, isLoading }
}

/**
 * The volunteers an organization may open a conversation with.
 *
 * <p>Has to fan out — opportunities first, then each opportunity's registrations — because the
 * backend has no "all my volunteers" endpoint. This mirrors the two-step load in
 * OrganizationVolunteersPage and OrganizationRegistrationsPage; those pages carry a note that
 * the third consumer is the point to extract a shared hook. This is that third consumer, but
 * extracting one they all adopt means editing two already-tested pages, so this hook covers
 * only the messaging case for now and those two should migrate onto it in a follow-up.
 *
 * <p>Uses allSettled rather than all: one opportunity failing to load its registrations should
 * cost you that opportunity's volunteers, not the entire picker.
 */
export function useOrganizationMessageRecipients(accessToken: string): RecipientsState {
  const [recipients, setRecipients] = useState<MessagingRecipient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    if (!accessToken) {
      return
    }

    const load = async () => {
      setIsLoading(true)

      try {
        const opportunities = await getMyOrganizationOpportunities(accessToken)

        const results = await Promise.allSettled(
          opportunities.map((opportunity) =>
            getOrganizationOpportunityRegistrations(accessToken, opportunity.opportunityId),
          ),
        )

        if (ignore) {
          return
        }

        const byUserId = new Map<string, MessagingRecipient>()

        results.forEach((result) => {
          if (result.status !== 'fulfilled') {
            return
          }

          result.value.forEach((registration) => {
            if (registration.userId && !byUserId.has(registration.userId)) {
              byUserId.set(registration.userId, {
                id: registration.userId,
                name: registration.volunteerName || 'Volunteer',
              })
            }
          })
        })

        setRecipients(
          Array.from(byUserId.values()).sort((a, b) => a.name.localeCompare(b.name)),
        )
      } catch {
        if (!ignore) {
          setRecipients([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [accessToken])

  return { recipients, isLoading }
}
