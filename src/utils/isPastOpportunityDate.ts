/**
 * Whether an opportunity's date (yyyy-MM-dd) is strictly before today. Today itself is
 * not "past" - it mirrors the backend's "today or in the future" rule for deletion eligibility.
 */
export function isPastOpportunityDate(date: string): boolean {
  const opportunityDate = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return opportunityDate.getTime() < today.getTime()
}
