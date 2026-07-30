import { describe, expect, it } from 'vitest'
import { getVolunteerInitial } from './getVolunteerInitial'

describe('getVolunteerInitial', () => {
  it('derives the initial from the first letter of a single name', () => {
    expect(getVolunteerInitial('Mariya')).toBe('M')
  })

  it('derives the initial from the first letter of a full name', () => {
    expect(getVolunteerInitial('Renata Murzina')).toBe('R')
  })

  it('returns V for the "Volunteer" fallback name', () => {
    expect(getVolunteerInitial('Volunteer')).toBe('V')
  })

  it('uppercases a lowercase first letter', () => {
    expect(getVolunteerInitial('mariya')).toBe('M')
  })
})
