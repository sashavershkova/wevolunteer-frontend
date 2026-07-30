import { describe, expect, it } from 'vitest'
import { formatOpportunityDate } from './formatOpportunityDate'

describe('formatOpportunityDate', () => {
  it('formats a yyyy-MM-dd date as "MMM d, yyyy"', () => {
    expect(formatOpportunityDate('2026-07-10')).toBe('Jul 10, 2026')
  })

  it('returns the original string for an unusable date instead of crashing', () => {
    expect(formatOpportunityDate('not-a-date')).toBe('not-a-date')
  })
})
