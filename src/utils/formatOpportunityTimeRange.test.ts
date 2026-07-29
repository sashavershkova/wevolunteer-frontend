import { describe, expect, it } from 'vitest'
import { formatOpportunityTimeRange } from './formatOpportunityTimeRange'

describe('formatOpportunityTimeRange', () => {
  it('formats a morning structured range', () => {
    expect(formatOpportunityTimeRange('09:00', '12:00')).toBe('9:00 AM – 12:00 PM')
  })

  it('formats an afternoon structured range', () => {
    expect(formatOpportunityTimeRange('14:30', '16:45')).toBe('2:30 PM – 4:45 PM')
  })

  it('returns the legacy time unchanged when structured fields are missing', () => {
    expect(formatOpportunityTimeRange(null, null, '9:00 AM - 12:00 PM')).toBe(
      '9:00 AM - 12:00 PM',
    )
  })

  it('returns null when all values are missing', () => {
    expect(formatOpportunityTimeRange(null, null, null)).toBeNull()
    expect(formatOpportunityTimeRange(undefined, undefined)).toBeNull()
  })

  it('falls back to legacy time rather than showing a partial range when only startTime exists', () => {
    expect(formatOpportunityTimeRange('09:00', null, '9:00 AM - 12:00 PM')).toBe(
      '9:00 AM - 12:00 PM',
    )
  })

  it('falls back to legacy time rather than showing a partial range when only endTime exists', () => {
    expect(formatOpportunityTimeRange(null, '12:00', '9:00 AM - 12:00 PM')).toBe(
      '9:00 AM - 12:00 PM',
    )
  })

  it('returns null for a partial range with no legacy fallback available', () => {
    expect(formatOpportunityTimeRange('09:00', null)).toBeNull()
    expect(formatOpportunityTimeRange(null, '12:00')).toBeNull()
  })
})
