import { describe, expect, it } from 'vitest'
import { imageProblem, toForm, toRow } from './questions'

const closed = {
  topic_id: 5,
  type: 'qapali',
  body: '  Sual $\\mathrm{H_{2}O}$  ',
  opt_A: ' bir ',
  opt_B: 'iki',
  opt_C: 'üç',
  opt_D: 'dörd',
  opt_E: 'beş',
  correct_answer: 'B',
  difficulty: 3,
  solution: '  ',
  image_path: undefined,
  source: ' DİM ',
  is_active: false,
}

describe('toRow', () => {
  it('trims text, builds the options object and nulls empty fields', () => {
    const row = toRow(closed)
    expect(row.body).toBe('Sual $\\mathrm{H_{2}O}$')
    expect(row.options).toEqual({ A: 'bir', B: 'iki', C: 'üç', D: 'dörd', E: 'beş' })
    expect(row.solution).toBeNull()
    expect(row.image_path).toBeNull()
    expect(row.source).toBe('DİM')
    expect(row.groups).toEqual([])
  })

  it('accepts an image-only question (no text) and keeps its letter options', () => {
    const row = toRow({ ...closed, body: undefined, image_path: 'KT1-S01-Q030.png', opt_A: 'A', opt_B: 'B', opt_C: 'C', opt_D: 'D', opt_E: 'E' })
    expect(row.body).toBe('')
    expect(row.image_path).toBe('KT1-S01-Q030.png')
    expect(row.options).toEqual({ A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' })
  })

  it('does not send options for open questions and stores the number with a dot', () => {
    const row = toRow({ ...closed, type: 'aciq_eded', correct_answer: ' 9,2 ' })
    expect(row.options).toBeNull()
    expect(row.correct_answer).toBe('9.2')
  })

  it('never contains id, code or timestamps (only the editable columns)', () => {
    expect(Object.keys(toRow(closed)).sort()).toEqual(
      ['body', 'correct_answer', 'difficulty', 'groups', 'image_path', 'is_active', 'options', 'solution',
        'solution_image_path', 'source', 'source_ref', 'topic_id', 'type', 'year'].sort(),
    )
  })
})

describe('toForm', () => {
  it('spreads the options object into opt_A..opt_E, missing ones become empty', () => {
    const f = toForm({ id: 'x', options: { A: 'a', C: 'c' } })
    expect(f).toMatchObject({ opt_A: 'a', opt_B: '', opt_C: 'c', opt_D: '', opt_E: '' })
  })
  it('handles open questions without options', () => {
    expect(toForm({ options: null }).opt_A).toBe('')
  })
})

describe('imageProblem', () => {
  it('accepts png/jpeg/webp up to 2 MB', () => {
    expect(imageProblem({ type: 'image/png', size: 1000 })).toBeNull()
    expect(imageProblem({ type: 'image/webp', size: 2 * 1024 * 1024 })).toBeNull()
  })
  it('rejects other types and big files', () => {
    expect(imageProblem({ type: 'image/gif', size: 10 })).not.toBeNull()
    expect(imageProblem({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).not.toBeNull()
  })
})
