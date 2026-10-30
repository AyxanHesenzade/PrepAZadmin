import { Input, Modal, Typography } from 'antd'
import { useState } from 'react'
import { splitQuestion } from '../lib/formula'
import { S } from '../lib/strings'

/** Paste a whole question with its A) … E) options; it is split into the text and the five variants. */
export default function PasteSplitModal({ open, onClose, onSplit }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(false)

  function submit() {
    const result = splitQuestion(text)
    if (!result) {
      setError(true)
      return
    }
    onSplit(result)
    setText('')
    setError(false)
    onClose()
  }

  return (
    <Modal open={open} onCancel={onClose} onOk={submit} okText={S.split} cancelText={S.cancel} title={S.pasteTitle} destroyOnHidden>
      <Typography.Paragraph type="secondary">{S.pasteHelp}</Typography.Paragraph>
      <Input.TextArea
        autoFocus
        rows={9}
        value={text}
        status={error ? 'error' : undefined}
        onChange={(e) => {
          setText(e.target.value)
          setError(false)
        }}
        placeholder={'Hansı maddə turşudur?\nA) NaOH\nB) HCl\nC) NaCl\nD) KOH\nE) CaO'}
      />
      {error && <Typography.Text type="danger">{S.splitFailed}</Typography.Text>}
    </Modal>
  )
}
