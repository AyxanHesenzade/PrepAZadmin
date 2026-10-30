// Helpers that make typing questions easy: plain chemistry -> LaTeX, snippet insertion, splitting a pasted question.

const ARROWS = {
  '->': '\\rightarrow',
  '→': '\\rightarrow',
  '=>': '\\rightarrow',
  '<=>': '\\rightleftharpoons',
  '<->': '\\rightleftharpoons',
  '⇌': '\\rightleftharpoons',
}

function formulaToken(token) {
  let body = token
  let charge = ''
  // Fe^3+, SO4^2-  (caret = explicit charge) or Na+, Cl-  (sign only, after a letter or bracket)
  const caret = body.match(/^(.*)\^(\d*[+-])$/)
  const sign = body.match(/^(.*[A-Za-z)\]])([+-])$/)
  if (caret) {
    body = caret[1]
    charge = caret[2]
  } else if (sign) {
    body = sign[1]
    charge = sign[2]
  }
  body = body
    .replace(/([A-Za-z)\]])(\d+)/g, '$1_{$2}') // digits after a letter or bracket are subscripts; leading digits stay (coefficients)
    .replace(/\*/g, '\\cdot ') // CuSO4*5H2O
  return charge ? `${body}^{${charge}}` : body
}

/**
 * Plain chemistry text -> `$\mathrm{...}$`.
 *   H2SO4 -> $\mathrm{H_{2}SO_{4}}$,  Fe^3+ -> $\mathrm{Fe^{3+}}$,  2H2 + O2 -> 2H2O  (spaces around + and arrows)
 */
export function chemToTex(input) {
  const tokens = (input ?? '').trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return ''
  const parts = tokens.map((t) => ARROWS[t] ?? (t === '+' || t === '-' || t === '=' ? t : formulaToken(t)))
  return `$\\mathrm{${parts.join(' ')}}$`
}

/** Is [pos] between an opening and a closing `$`? */
export function insideMath(value, pos) {
  return (value.slice(0, pos).split('$').length - 1) % 2 === 1
}

/** `$\mathrm{X}$` -> `X` (used when the cursor is already inside a formula). */
export function unwrapMath(tex) {
  const m = tex.match(/^\$\\mathrm\{(.*)\}\$$/s)
  return m ? m[1] : tex
}

/**
 * Inserts a LaTeX piece at the cursor. Inside `$...$` it goes in as is; outside it is wrapped in `$\mathrm{...}$`.
 * [caretBack] = how many characters from the end of the piece the cursor should stay (e.g. 1 for `_{}` -> inside the braces).
 * Returns { value, cursor }.
 */
export function insertTex(value, start, end, tex, caretBack = 0) {
  const inside = insideMath(value, start)
  const open = inside ? '' : '$\\mathrm{'
  const close = inside ? '' : '}$'
  const piece = `${open}${tex}${close}`
  const next = value.slice(0, start) + piece + value.slice(end)
  return { value: next, cursor: start + open.length + tex.length - caretBack }
}

/** Inserts finished text (e.g. a converted formula) at the cursor; a wrapped formula is unwrapped inside `$...$`. */
export function insertText(value, start, end, text) {
  const piece = insideMath(value, start) ? unwrapMath(text) : text
  return { value: value.slice(0, start) + piece + value.slice(end), cursor: start + piece.length }
}

/**
 * "12. Question text A) one B) two C) three D) four E) five" -> { stem, options: {A..E} }, or null if A–E are not all found
 * in order. A leading question number is removed.
 */
export function splitQuestion(text) {
  const flat = (text ?? '').replace(/\r/g, '').trim()
  const found = []
  let cursor = 0
  for (const letter of 'ABCDE') {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${letter}\\)\\s*`, 'gu')
    re.lastIndex = cursor
    const m = re.exec(flat)
    if (!m) return null
    found.push({ letter, start: m.index, textStart: m.index + m[0].length })
    cursor = m.index + m[0].length
  }
  const clean = (s) => s.replace(/\s+/g, ' ').trim()
  const options = {}
  found.forEach((f, i) => {
    options[f.letter] = clean(flat.slice(f.textStart, i + 1 < found.length ? found[i + 1].start : flat.length))
  })
  return { stem: clean(flat.slice(0, found[0].start)).replace(/^\d+\.\s*/, ''), options }
}
