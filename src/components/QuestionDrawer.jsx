import { Alert, App, Button, Card, Divider, Drawer, Form, Input, InputNumber, Select, Skeleton, Space, Switch, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createQuestion, findSimilar, getQuestion, LETTERS, nextCode, toForm, updateQuestion } from '../lib/questions'
import { S } from '../lib/strings'
import FormulaToolbar from './FormulaToolbar'
import ImageField from './ImageField'
import MathText from './MathText'
import PasteSplitModal from './PasteSplitModal'

const NEW_DEFAULTS = {
  type: 'qapali',
  difficulty: 3,
  is_active: false, // a new question starts hidden until someone has checked it
  groups: [],
  source: '',
}

function topicOptions(leaves, subjectId) {
  const bySection = new Map()
  for (const t of leaves.filter((x) => x.subject_id === subjectId)) {
    if (!bySection.has(t.section)) bySection.set(t.section, [])
    bySection.get(t.section).push({ value: t.id, label: t.name })
  }
  return [...bySection].map(([label, options]) => ({ label, options }))
}

function Preview({ text }) {
  if (!text) return null
  return (
    <Card size="small" style={{ marginTop: 8, background: 'rgba(0,0,0,0.02)' }} title={S.preview}>
      <MathText text={text} />
    </Card>
  )
}

/** Edit (questionId set) or create (questionId null) one question. The form exists only while the drawer is open. */
export default function QuestionDrawer({ open, ...props }) {
  return open ? <QuestionForm {...props} /> : null
}

function QuestionForm({ questionId, meta, onClose, onSaved }) {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const isNew = questionId === null
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [similar, setSimilar] = useState([])
  const bodyRef = useRef(null)
  const solutionRef = useRef(null)
  const optRefs = useRef({})

  const type = Form.useWatch('type', form)
  const body = Form.useWatch('body', form)
  const solution = Form.useWatch('solution', form)
  const subjectId = Form.useWatch('subject_id', form)
  const topicId = Form.useWatch('topic_id', form)
  const opts = Form.useWatch((v) => LETTERS.map((l) => v?.[`opt_${l}`]), form)

  const subjectOfTopic = useMemo(() => {
    const topic = meta.leaves.find((t) => t.id === topicId)
    return topic?.subject_id
  }, [meta.leaves, topicId])

  useEffect(() => {
    let alive = true
    if (isNew) {
      form.setFieldsValue(NEW_DEFAULTS)
      return undefined
    }
    getQuestion(questionId)
      .then((row) => {
        if (!alive) return
        setCode(row.code)
        const values = toForm(row)
        values.subject_id = meta.leaves.find((t) => t.id === row.topic_id)?.subject_id
        form.setFieldsValue(values)
      })
      .catch((e) => message.error(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [questionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubjectChange(id) {
    form.setFieldValue('topic_id', undefined)
    if (!isNew) return
    const subject = meta.subjects.find((s) => s.id === id)
    try {
      setCode(subject ? await nextCode(subject) : '')
    } catch (e) {
      message.error(e.message)
    }
  }

  async function save() {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    setSaving(true)
    try {
      const row = isNew ? await createQuestion(code, values) : await updateQuestion(questionId, values)
      message.success(S.saved)
      onSaved(row)
      onClose()
    } catch (e) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function checkSimilar() {
    try {
      setSimilar(await findSimilar(form.getFieldValue('body'), questionId))
    } catch {
      setSimilar([]) // the warning is a convenience; never block the form
    }
  }

  function fillFromPaste({ stem, options }) {
    form.setFields([
      { name: 'type', value: 'qapali', touched: true },
      { name: 'body', value: stem, touched: true },
      ...LETTERS.map((l) => ({ name: `opt_${l}`, value: options[l], touched: true })),
    ])
    message.success(S.splitDone)
    checkSimilar()
  }

  function close() {
    if (!form.isFieldsTouched()) return onClose()
    modal.confirm({ title: S.unsavedConfirm, okText: S.cancel, cancelText: S.retry, onOk: onClose })
    return undefined
  }

  const closed = type === 'qapali'
  const required = [{ required: true, message: S.required }]
  const optionRule = [{ required: true, whitespace: true, message: S.needFive }]

  return (
    <Drawer
      open
      onClose={close}
      size={780}
      title={
        <Space>
          <span>{isNew ? S.createQuestion : S.editQuestion}</span>
          {code && <Typography.Text code>{code}</Typography.Text>}
        </Space>
      }
      extra={
        <Space>
          <Button onClick={() => setPasteOpen(true)} disabled={loading}>
            {S.pasteButton}
          </Button>
          <Button onClick={close}>{S.cancel}</Button>
          <Button type="primary" onClick={save} loading={saving} disabled={loading}>
            {S.save}
          </Button>
        </Space>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Form form={form} layout="vertical" requiredMark="optional">
          <Space size={16} wrap style={{ width: '100%' }} align="start">
            <Form.Item name="subject_id" label={S.subject} rules={required} style={{ minWidth: 200 }}>
              <Select
                options={meta.subjects.map((s) => ({ value: s.id, label: s.name }))}
                onChange={onSubjectChange}
                disabled={!isNew && Boolean(subjectOfTopic)}
              />
            </Form.Item>
            <Form.Item name="topic_id" label={S.topic} rules={[{ required: true, message: S.pickTopic }]} style={{ minWidth: 320 }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={topicOptions(meta.leaves, subjectId)}
                disabled={!subjectId}
                placeholder={S.pickTopic}
              />
            </Form.Item>
          </Space>

          <Space size={16} wrap align="start">
            <Form.Item name="type" label={S.type} rules={required} style={{ minWidth: 200 }}>
              <Select
                options={Object.entries(S.types).map(([value, label]) => ({ value, label }))}
                onChange={() => form.setFieldValue('correct_answer', undefined)}
              />
            </Form.Item>
            <Form.Item name="difficulty" label={`${S.difficulty} (1–5)`} rules={required}>
              <InputNumber min={1} max={5} precision={0} />
            </Form.Item>
            <Form.Item name="is_active" label={S.isActive} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <div style={{ marginBottom: 4 }}>{S.body}</div>
          <FormulaToolbar form={form} name="body" getEl={() => bodyRef.current?.resizableTextArea?.textArea} />
          <Form.Item
            name="body"
            // the text may be empty when the question is a picture (scanned book): then the image is the question
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, v) => ((v ?? '').trim() || getFieldValue('image_path') ? Promise.resolve() : Promise.reject(new Error(S.required))),
              }),
            ]}
            extra={S.bodyHelp}
          >
            <Input.TextArea ref={bodyRef} autoSize={{ minRows: 3, maxRows: 12 }} onBlur={checkSimilar} />
          </Form.Item>
          {similar.length > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 8 }}
              message={S.similarTitle}
              description={similar.map((q) => (
                <div key={q.id}>
                  <Typography.Text strong>{q.code}</Typography.Text> <MathText text={q.body.slice(0, 120)} />
                </div>
              ))}
            />
          )}
          <Preview text={body} />

          <Form.Item name="image_path" label={S.questionImage} style={{ marginTop: 16 }}>
            <ImageField code={code} kind="question" disabled={!code} />
          </Form.Item>

          {closed && (
            <>
              <Divider orientation="left">{S.options}</Divider>
              {LETTERS.map((l, i) => (
                <Form.Item key={l} name={`opt_${l}`} label={l} rules={optionRule} style={{ marginBottom: 12 }}>
                  <Input
                    ref={(r) => {
                      optRefs.current[l] = r
                    }}
                    addonBefore={<FormulaToolbar compact form={form} name={`opt_${l}`} getEl={() => optRefs.current[l]?.input} />}
                    addonAfter={opts?.[i] ? <MathText text={opts[i]} /> : null}
                  />
                </Form.Item>
              ))}
            </>
          )}

          <Form.Item
            name="correct_answer"
            label={S.correctAnswer}
            style={{ marginTop: 16 }}
            rules={[
              ...required,
              ...(type === 'aciq_eded' ? [{ pattern: /^-?\d+([.,]\d+)?$/, message: S.badNumber }] : []),
            ]}
            extra={type === 'aciq_eded' ? S.numericAnswerHelp : undefined}
          >
            {closed ? (
              <Select options={LETTERS.map((l) => ({ value: l, label: l }))} style={{ width: 120 }} />
            ) : (
              <Input style={{ maxWidth: 240 }} />
            )}
          </Form.Item>

          <Divider orientation="left">{S.solution}</Divider>
          <FormulaToolbar form={form} name="solution" getEl={() => solutionRef.current?.resizableTextArea?.textArea} />
          <Form.Item name="solution">
            <Input.TextArea ref={solutionRef} autoSize={{ minRows: 3, maxRows: 12 }} />
          </Form.Item>
          <Preview text={solution} />
          <Form.Item name="solution_image_path" label={S.solutionImage} style={{ marginTop: 16 }}>
            <ImageField code={code} kind="solution" disabled={!code} />
          </Form.Item>

          <Divider orientation="left">{S.source}</Divider>
          <Space size={16} wrap align="start">
            <Form.Item name="source" label={S.source} rules={[{ required: true, whitespace: true, message: S.required }]}>
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="source_ref" label={S.sourceRef}>
              <Input style={{ width: 320 }} />
            </Form.Item>
            <Form.Item name="year" label={S.year}>
              <InputNumber min={1990} max={2100} precision={0} />
            </Form.Item>
            <Form.Item name="groups" label={S.groups}>
              <Select mode="multiple" style={{ minWidth: 140 }} options={[1, 2, 3, 4, 5].map((g) => ({ value: g, label: String(g) }))} />
            </Form.Item>
          </Space>
        </Form>
      )}
      <PasteSplitModal open={pasteOpen} onClose={() => setPasteOpen(false)} onSplit={fillFromPaste} />
    </Drawer>
  )
}
