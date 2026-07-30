import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getOpportunityDisplayStatus } from './getOpportunityDisplayStatus'
import { opp1 } from '../tests/fixtures/opportunities'
import type { OpportunityStatus } from '../types/Opportunity'

const MOCKED_TODAY = '2026-01-01T00:00:00'

describe('getOpportunityDisplayStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(MOCKED_TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns OPEN for a future opportunity with status OPEN', () => {
    expect(getOpportunityDisplayStatus({ ...opp1, date: '2026-07-10', status: 'OPEN' })).toBe(
      'OPEN',
    )
  })

  it('returns CLOSED for a future opportunity with status CLOSED', () => {
    expect(getOpportunityDisplayStatus({ ...opp1, date: '2026-07-10', status: 'CLOSED' })).toBe(
      'CLOSED',
    )
  })

  it('returns COMPLETED for a past opportunity with stored status OPEN', () => {
    expect(getOpportunityDisplayStatus({ ...opp1, date: '2025-06-01', status: 'OPEN' })).toBe(
      'COMPLETED',
    )
  })

  it('returns CLOSED for a past opportunity with stored status CLOSED - CLOSED takes precedence over date', () => {
    expect(getOpportunityDisplayStatus({ ...opp1, date: '2025-06-01', status: 'CLOSED' })).toBe(
      'CLOSED',
    )
  })

  it('is case-safe if the API returns non-uppercase status casing', () => {
    expect(
      getOpportunityDisplayStatus({
        ...opp1,
        date: '2026-07-10',
        status: 'closed' as OpportunityStatus,
      }),
    ).toBe('CLOSED')

    expect(
      getOpportunityDisplayStatus({
        ...opp1,
        date: '2025-06-01',
        status: 'closed' as OpportunityStatus,
      }),
    ).toBe('CLOSED')
  })

  it('does not crash for an unusable date and treats it as not-past', () => {
    expect(() =>
      getOpportunityDisplayStatus({ ...opp1, date: 'not-a-date', status: 'OPEN' }),
    ).not.toThrow()
    expect(getOpportunityDisplayStatus({ ...opp1, date: 'not-a-date', status: 'OPEN' })).toBe(
      'OPEN',
    )
  })
})
