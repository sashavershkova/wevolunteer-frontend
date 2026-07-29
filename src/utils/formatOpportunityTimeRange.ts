const HH_MM_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/

function formatClockTime(time: string): string | null {
  const match = HH_MM_PATTERN.exec(time)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = match[2]
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12

  return `${displayHours}:${minutes} ${period}`
}

/**
 * Formats an opportunity's structured startTime/endTime (HH:mm) into a
 * readable 12-hour range (e.g. "9:00 AM – 12:00 PM"). Falls back to the
 * legacy free-text time when only one of startTime/endTime is present or
 * both are missing - a single stored time is never a valid range, and
 * inventing one from half the data would misrepresent the opportunity.
 * Returns null when no time information exists at all, so callers can omit
 * the time row entirely instead of showing misleading text.
 */
export function formatOpportunityTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  legacyTime?: string | null,
): string | null {
  if (startTime && endTime) {
    const formattedStart = formatClockTime(startTime)
    const formattedEnd = formatClockTime(endTime)

    if (formattedStart && formattedEnd) {
      return `${formattedStart} – ${formattedEnd}`
    }
  }

  if (legacyTime) {
    return legacyTime
  }

  return null
}
