import { Button, Input, Popover, Space, Typography } from 'antd'
import { useState } from 'react'
import { chemToTex, insertTex, insertText } from '../lib/formula'
import { S } from '../lib/strings'
import MathText from './MathText'

// [label, LaTeX piece, caret steps back from the end of the piece, tooltip]
const SYMBOLS = [
  ['→', '\\rightarrow ', 0, S.symbolArrow],
  ['⇌', '\\rightleftharpoons ', 0, S.symbolEquilibrium],
  ['↑', '\\uparrow ', 0, S.symbolGas],
  ['↓', '\\downarrow ', 0, S.symbolPrecipitate],
  ['Δ', '\\Delta ', 0, 'Delta'],
  ['°', '^\\circ ', 0, S.symbolDegree],
  ['·', '\\cdot ', 0, S.symbolDot],
  ['×', '\\times ', 0, S.symbolTimes],
  ['≥', '\\geq ', 0, '≥'],
  ['≤', '\\leq ', 0, '≤'],
  ['xₙ', '_{}', 1, S.symbolSub],
  ['xⁿ', '^{}', 1, S.symbolSup],
  ['a/b', '\\frac{}{}', 3, S.symbolFrac],
  ['√', '\\sqrt{}', 1, S.symbolSqrt],
]

/**
 * Helper buttons for one text field. [getEl] returns the DOM input/textarea, [form]/[name] the Ant Design form field.
 * The popover converts plain chemistry (H2SO4 + 2NaOH -> Na2SO4 + 2H2O) into the LaTeX the mobile app shows.
 */
export default function FormulaToolbar({ form, name, getEl, compact = false }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const tex = chemToTex(text)

  function apply(edit) {
    const el = getEl()
    const value = form.getFieldValue(name) ?? ''
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? start
    const { value: next, cursor } = edit(value, start, end)
    form.setFields([{ name, value: next, touched: true }])
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursor, cursor)
    })
  }

  function addFormula() {
    if (!tex) return
    apply((value, start, end) => insertText(value, start, end, tex))
    setText('')
    setOpen(false)
  }

  const content = (
    <Space orientation="vertical" size={8} style={{ width: 380, maxWidth: '80vw' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {S.formulaHelp}
      </Typography.Text>
      <Input.TextArea
        autoFocus
        autoSize={{ minRows: 2, maxRows: 4 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="H2SO4 + 2NaOH -> Na2SO4 + 2H2O"
        onPressEnter={(e) => {
          e.preventDefault()
          addFormula()
        }}
      />
      <div style={{ minHeight: 40, padding: 8, background: 'rgba(0,0,0,0.03)', borderRadius: 6 }}>
        {tex ? <MathText text={tex} /> : <Typography.Text type="secondary">{S.preview}</Typography.Text>}
      </div>
      <Button type="primary" size="small" onClick={addFormula} disabled={!tex}>
        {S.insertFormula}
      </Button>
    </Space>
  )

  return (
    <Space size={4} wrap style={{ marginBottom: compact ? 0 : 6 }}>
      <Popover trigger="click" open={open} onOpenChange={setOpen} content={content} title={S.formulaTitle} placement="bottomLeft">
        <Button size="small" type="dashed">
          {S.formulaButton}
        </Button>
      </Popover>
      {!compact &&
        SYMBOLS.map(([label, piece, back, hint]) => (
          <Button
            key={label}
            size="small"
            title={hint}
            onMouseDown={(e) => e.preventDefault() /* keep the cursor in the text field */}
            onClick={() => apply((value, start, end) => insertTex(value, start, end, piece, back))}
          >
            {label}
          </Button>
        ))}
    </Space>
  )
}
