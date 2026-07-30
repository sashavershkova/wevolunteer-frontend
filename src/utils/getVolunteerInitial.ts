/** Derives a circular-avatar initial from an already-resolved display name (i.e. the
 * "Volunteer" fallback should already be applied before calling this). */
export function getVolunteerInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || 'V'
}
