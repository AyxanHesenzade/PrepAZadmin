import { describe, expect, it } from 'vitest'
import { chemToTex, insertTex, insertText, insideMath, splitQuestion, unwrapMath } from './formula'

describe('chemToTex', () => {
  it.each([
    ['H2SO4', '$\\mathrm{H_{2}SO_{4}}$'],
    ['Fe2(SO4)3', '$\\mathrm{Fe_{2}(SO_{4})_{3}}$'],
    ['Ca(OH)2', '$\\mathrm{Ca(OH)_{2}}$'],
    ['Fe^3+', '$\\mathrm{Fe^{3+}}$'],
    ['SO4^2-', '$\\mathrm{SO_{4}^{2-}}$'],
    ['Na+', '$\\mathrm{Na^{+}}$'],
    ['Cl-', '$\\mathrm{Cl^{-}}$'],
    ['CuSO4*5H2O', '$\\mathrm{CuSO_{4}\\cdot 5H_{2}O}$'],
    ['2H2 + O2 -> 2H2O', '$\\mathrm{2H_{2} + O_{2} \\rightarrow 2H_{2}O}$'],
    ['N2 + 3H2 <=> 2NH3', '$\\mathrm{N_{2} + 3H_{2} \\rightleftharpoons 2NH_{3}}$'],
    ['Na+ + Cl- → NaCl', '$\\mathrm{Na^{+} + Cl^{-} \\rightarrow NaCl}$'],
  ])('%s', (input, expected) => {
    expect(chemToTex(input)).toBe(expected)
  })

  it('is empty for empty input', () => {
    expect(chemToTex('   ')).toBe('')
  })

  it('starts with \\mathrm{ as the database checks require', () => {
    expect(chemToTex('H2O').startsWith('$\\mathrm{')).toBe(true)
  })
})

describe('insideMath / unwrapMath', () => {
  it('knows whether the cursor is between dollar signs', () => {
    const v = 'a $x$ b'
    expect(insideMath(v, 1)).toBe(false)
    expect(insideMath(v, 4)).toBe(true)
    expect(insideMath(v, 6)).toBe(false)
  })
  it('unwraps a formula and leaves other text alone', () => {
    expect(unwrapMath('$\\mathrm{H_{2}O}$')).toBe('H_{2}O')
    expect(unwrapMath('plain')).toBe('plain')
  })
})

describe('insertTex', () => {
  it('wraps the piece in a formula when the cursor is in plain text', () => {
    expect(insertTex('abc', 3, 3, '\\rightarrow ')).toEqual({ value: 'abc$\\mathrm{\\rightarrow }$', cursor: 3 + 9 + 12 })
  })
  it('inserts the raw piece inside a formula and keeps the caret inside braces', () => {
    const r = insertTex('$\\mathrm{H}$', 10, 10, '_{}', 1)
    expect(r.value).toBe('$\\mathrm{H_{}}$')
    expect(r.cursor).toBe(12)
  })
  it('replaces a selection', () => {
    expect(insertTex('a XX b', 2, 4, '\\cdot ').value).toBe('a $\\mathrm{\\cdot }$ b')
  })
})

describe('insertText', () => {
  it('keeps a converted formula wrapped in plain text', () => {
    expect(insertText('Reaksiya: ', 10, 10, '$\\mathrm{H_{2}O}$').value).toBe('Reaksiya: $\\mathrm{H_{2}O}$')
  })
  it('unwraps it when already inside a formula', () => {
    expect(insertText('$\\mathrm{A + }$', 13, 13, '$\\mathrm{H_{2}O}$').value).toBe('$\\mathrm{A + H_{2}O}$')
  })
})

describe('splitQuestion', () => {
  it('splits stem and the five options, removing the question number', () => {
    const r = splitQuestion('12. Hansı maddədir?\nA) bir\nB) iki üç\nC) dörd D) beş E) altı')
    expect(r.stem).toBe('Hansı maddədir?')
    expect(r.options).toEqual({ A: 'bir', B: 'iki üç', C: 'dörd', D: 'beş', E: 'altı' })
  })
  it('keeps formulas inside options', () => {
    const r = splitQuestion('Sual A) $\\mathrm{H_{2}}$ B) b C) c D) d E) e')
    expect(r.options.A).toBe('$\\mathrm{H_{2}}$')
  })
  it('returns null when an option is missing', () => {
    expect(splitQuestion('Sual A) a B) b C) c D) d')).toBeNull()
    expect(splitQuestion('')).toBeNull()
  })
  it('does not treat a letter inside a word as a marker', () => {
    const r = splitQuestion('Sual A) mA) x B) b C) c D) d E) e')
    expect(r.options.A).toBe('mA) x')
  })
})
