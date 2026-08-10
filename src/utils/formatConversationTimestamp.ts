const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

/**
 * Formats an inbox timestamp the way a messaging app does: precise for today, coarser as it
 * recedes. Mirrors the shapes the original placeholder page hard-coded -- "2:14 PM",
 * "Yesterday", "Mon", "Last week".
 *
 * <p>Comparison is done on calendar days rather than elapsed milliseconds, so a message sent
 * at 11pm still reads "Yesterday" at 1am rather than flipping to a weekday name after 24
 * hours. `now` is injectable so tests do not depend on the wall clock.
 */
export function formatConversationTimestamp(
  isoTimestamp: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!isoTimestamp) {
    return ''
  }

  const sentAt = new Date(isoTimestamp)

  if (Number.isNaN(sentAt.getTime())) {
    return ''
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const startOfSentDay = new Date(
    sentAt.getFullYear(),
    sentAt.getMonth(),
    sentAt.getDate(),
  ).getTime()

  const dayDifference = Math.round((startOfToday - startOfSentDay) / DAY_MS)

  // A clock skew or a message dated slightly in the future should read as "now", not as a
  // negative-day case that falls through to a date.
  if (dayDifference <= 0) {
    return sentAt.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (dayDifference === 1) {
    return 'Yesterday'
  }

  if (dayDifference < 7) {
    return sentAt.toLocaleDateString(undefined, { weekday: 'short' })
  }

  if (dayDifference < 14) {
    return 'Last week'
  }

  return sentAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** The longer form shown against an individual message inside a thread. */
export function formatMessageTimestamp(
  isoTimestamp: string | null | undefined,
): string {
  if (!isoTimestamp) {
    return ''
  }

  const sentAt = new Date(isoTimestamp)

  if (Number.isNaN(sentAt.getTime())) {
    return ''
  }

  return sentAt.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
