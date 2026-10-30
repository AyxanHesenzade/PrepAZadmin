import { describe, expect, it } from 'vitest'
import { compareVersions, parseVersion, URL_PATTERN, VERSION_PATTERN } from './appConfig'

describe('parseVersion', () => {
  it('reads versions with and without build', () => {
    expect(parseVersion('0.0.1+2')).toEqual([0, 0, 1, 2])
    expect(parseVersion(' 1.2.3 ')).toEqual([1, 2, 3, 0])
  })
  it('rejects anything else', () => {
    expect(parseVersion('1.2')).toBeNull()
    expect(parseVersion('v1.2.3')).toBeNull()
    expect(parseVersion('')).toBeNull()
    expect(parseVersion(undefined)).toBeNull()
  })
})

describe('compareVersions', () => {
  it('orders by major, minor, patch, build', () => {
    expect(compareVersions('0.0.1+2', '0.0.1+3')).toBe(-1)
    expect(compareVersions('0.1.0', '0.0.9')).toBe(1)
    expect(compareVersions('1.0.0', '1.0.0+0')).toBe(0)
  })
  it('is null for a broken version', () => {
    expect(compareVersions('abc', '1.0.0')).toBeNull()
  })
})

describe('patterns', () => {
  it('version pattern matches the database rule', () => {
    expect(VERSION_PATTERN.test('0.0.1+2')).toBe(true)
    expect(VERSION_PATTERN.test('0.0')).toBe(false)
  })
  it('only http(s) links', () => {
    expect(URL_PATTERN.test('https://drive.google.com/x')).toBe(true)
    expect(URL_PATTERN.test('javascript:alert(1)')).toBe(false)
  })
})
