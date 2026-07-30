import type { Registration } from '../services/api/registrationService'

function getComparableRegisteredAt(registration: Registration): number {
  const timestamp = new Date(registration.registeredAt).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

/**
 * Returns a new array (the input is never mutated) sorted by registeredAt ascending
 * (oldest first), falling back to volunteerName alphabetically, then original order,
 * so ties and unusable registeredAt values still produce a stable, predictable order.
 */
export function sortRegistrations(registrations: Registration[]): Registration[] {
  return registrations
    .map((registration, index) => ({ registration, index }))
    .sort((a, b) => {
      const aTimestamp = getComparableRegisteredAt(a.registration)
      const bTimestamp = getComparableRegisteredAt(b.registration)

      if (aTimestamp !== bTimestamp) {
        return aTimestamp - bTimestamp
      }

      const aName = a.registration.volunteerName ?? ''
      const bName = b.registration.volunteerName ?? ''
      const nameComparison = aName.localeCompare(bName)

      if (nameComparison !== 0) {
        return nameComparison
      }

      return a.index - b.index
    })
    .map(({ registration }) => registration)
}
