import { describe, expect, it } from 'vitest'
import {
  formatConversationTimestamp,
  formatMessageTimestamp,
} from './formatConversationTimestamp'

const NOW = new Date(2026, 7, 4, 15, 0, 0)

describe('formatConversationTimestamp', () => {
  it('shows a clock time for messages sent today', () => {
    const result = formatConversationTimestamp(
      new Date(2026, 7, 4, 14, 14).toISOString(),
      NOW,
    )

    expect(result).toMatch(/2:14/)
  })

  it('says Yesterday for the previous calendar day', () => {
    expect(
      formatConversationTimestamp(new Date(2026, 7, 3, 23, 30).toISOString(), NOW),
    ).toBe('Yesterday')
  })

  it('uses calendar days, so late last night is still Yesterday just after midnight', () => {
    const justAfterMidnight = new Date(2026, 7, 4, 0, 30)

    expect(
      formatConversationTimestamp(
        new Date(2026, 7, 3, 23, 0).toISOString(),
        justAfterMidnight,
      ),
    ).toBe('Yesterday')
  })

  it('uses a weekday name within the last week', () => {
    expect(
      formatConversationTimestamp(new Date(2026, 7, 1, 10, 0).toISOString(), NOW),
    ).toMatch(/^[A-Z][a-z]{2}$/)
  })

  it('says Last week between seven and fourteen days ago', () => {
    expect(
      formatConversationTimestamp(new Date(2026, 6, 28, 10, 0).toISOString(), NOW),
    ).toBe('Last week')
  })

  it('falls back to a date beyond two weeks', () => {
    expect(
      formatConversationTimestamp(new Date(2026, 6, 4, 10, 0).toISOString(), NOW),
    ).toMatch(/Jul/)
  })

  it('treats a future timestamp as now rather than falling through to a date', () => {
    expect(
      formatConversationTimestamp(new Date(2026, 7, 4, 15, 5).toISOString(), NOW),
    ).toMatch(/3:05/)
  })

  it('returns an empty string for missing or unparseable input', () => {
    expect(formatConversationTimestamp(null, NOW)).toBe('')
    expect(formatConversationTimestamp(undefined, NOW)).toBe('')
    expect(formatConversationTimestamp('not a date', NOW)).toBe('')
  })
})

describe('formatMessageTimestamp', () => {
  it('includes both the date and the time', () => {
    const result = formatMessageTimestamp(new Date(2026, 7, 4, 14, 14).toISOString())

    expect(result).toMatch(/Aug/)
    expect(result).toMatch(/2:14/)
  })

  it('returns an empty string for missing or unparseable input', () => {
    expect(formatMessageTimestamp(null)).toBe('')
    expect(formatMessageTimestamp('nope')).toBe('')
  })
})
