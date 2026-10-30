import { describe, expect, it } from 'vitest'
import { isValidDate } from './examPeriods'

describe('isValidDate', () => {
  it('accepts a real date', () => expect(isValidDate('2027-02-15')).toBe(true))
  it('rejects a wrong format', () => expect(isValidDate('15.02.2027')).toBe(false))
  it('rejects a date that does not exist', () => expect(isValidDate('2027-02-30')).toBe(false))
  it('rejects empty', () => expect(isValidDate('')).toBe(false))
})
