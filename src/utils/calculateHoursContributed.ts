import type { Registration } from '../services/api/registrationService'
import { isPastOpportunityDate } from './isPastOpportunityDate'

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/

function toMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time)

  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * Sums hours contributed across completed registrations only - hours for
 * upcoming registrations haven't happened yet and shouldn't be counted.
 * A registration only contributes if it has both startTime and endTime in
 * HH:mm format; registrations with only the legacy free-text time field (or
 * no time at all) have no computable duration and are silently skipped
 * rather than guessed at.
 */
export function calculateHoursContributed(registrations: Registration[]): number {
  const totalMinutes = registrations
    .filter((registration) => isPastOpportunityDate(registration.date))
    .reduce((total, registration) => {
      if (!registration.startTime || !registration.endTime) {
        return total
      }

      const startMinutes = toMinutes(registration.startTime)
      const endMinutes = toMinutes(registration.endTime)

      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        return total
      }

      return total + (endMinutes - startMinutes)
    }, 0)

  return Math.round((totalMinutes / 60) * 10) / 10
}