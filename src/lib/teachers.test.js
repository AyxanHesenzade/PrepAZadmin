import { describe, expect, it } from 'vitest'
import { PHONE_PATTERN, photoProblem, toRow } from './teachers'

const base = {
  full_name: '  Aydın Əliyev ',
  subject_label: 'Kimya müəllimi',
  lesson_mode: 'both',
  address: ' Bakı ',
  phone: ' +994501112233 ',
  about: '  ',
  offer: ' Qrup ',
  photo_path: undefined,
  consent: true,
  is_active: true,
}

describe('toRow', () => {
  it('trims text and turns empty optional fields into null', () => {
    const row = toRow(base)
    expect(row.full_name).toBe('Aydın Əliyev')
    expect(row.phone).toBe('+994501112233')
    expect(row.address).toBe('Bakı')
    expect(row.about).toBeNull()
    expect(row.offer).toBe('Qrup')
    expect(row.photo_path).toBeNull()
    expect(row.sort_order).toBe(0)
  })

  it('drops the address of an online teacher', () => {
    expect(toRow({ ...base, lesson_mode: 'online' }).address).toBeNull()
  })

  it('never sends id or timestamps', () => {
    expect(Object.keys(toRow(base)).sort()).toEqual(
      ['about', 'address', 'consent', 'full_name', 'is_active', 'lesson_mode', 'offer', 'phone', 'photo_path', 'sort_order', 'subject_label'].sort(),
    )
  })

  it('consent and active are real booleans', () => {
    const row = toRow({ ...base, consent: undefined, is_active: undefined })
    expect(row.consent).toBe(false)
    expect(row.is_active).toBe(false)
  })
})

describe('PHONE_PATTERN', () => {
  it('accepts normal numbers', () => {
    expect(PHONE_PATTERN.test('+994501234567')).toBe(true)
    expect(PHONE_PATTERN.test('050 123 45 67')).toBe(true)
    expect(PHONE_PATTERN.test('(012) 555-11-22')).toBe(true)
  })
  it('rejects letters and too short numbers', () => {
    expect(PHONE_PATTERN.test('abc')).toBe(false)
    expect(PHONE_PATTERN.test('12345')).toBe(false)
  })
})

describe('photoProblem', () => {
  it('accepts png/jpeg/webp up to 1 MB', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 1024 * 1024 })).toBeNull()
  })
  it('rejects other types and big files', () => {
    expect(photoProblem({ type: 'image/gif', size: 10 })).not.toBeNull()
    expect(photoProblem({ type: 'image/png', size: 1024 * 1024 + 1 })).not.toBeNull()
  })
})
