import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isPastOpportunityDate } from './isPastOpportunityDate'

describe('isPastOpportunityDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-29T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for a date before today', () => {
    expect(isPastOpportunityDate('2026-07-28')).toBe(true)
  })

  it('returns false for today', () => {
    expect(isPastOpportunityDate('2026-07-29')).toBe(false)
  })

  it('returns false for a date after today', () => {
    expect(isPastOpportunityDate('2026-07-30')).toBe(false)
  })
})
