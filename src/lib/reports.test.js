import { describe, expect, it } from 'vitest'
import { formatDate, STATUSES } from './reports'

describe('formatDate', () => {
  it('formats as day.month.year hour:minute with leading zeros', () => {
    expect(formatDate(new Date(2026, 0, 5, 9, 7).toISOString())).toBe('05.01.2026 09:07')
  })
})

describe('STATUSES', () => {
  it('matches the database check (new, seen, done)', () => {
    expect(STATUSES).toEqual(['new', 'seen', 'done'])
  })
})
