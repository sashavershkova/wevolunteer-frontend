/** Formats a registeredAt ISO datetime as a date only (e.g. "Jul 10, 2026"). Returns
 * null for a missing/unparseable value so callers can omit the line instead of
 * showing something misleading. */
export function formatRegisteredAtDate(dateString: string | null): string | null {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
