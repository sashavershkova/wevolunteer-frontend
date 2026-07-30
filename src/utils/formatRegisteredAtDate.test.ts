import { describe, expect, it } from 'vitest'
import { formatRegisteredAtDate } from './formatRegisteredAtDate'

describe('formatRegisteredAtDate', () => {
  it('formats an ISO datetime as a date only', () => {
    expect(formatRegisteredAtDate('2026-07-10T10:00:00')).toBe('Jul 10, 2026')
  })

  it('returns null for a missing value', () => {
    expect(formatRegisteredAtDate(null)).toBeNull()
  })

  it('returns null for an unparseable value instead of crashing', () => {
    expect(() => formatRegisteredAtDate('not-a-date')).not.toThrow()
    expect(formatRegisteredAtDate('not-a-date')).toBeNull()
  })
})
