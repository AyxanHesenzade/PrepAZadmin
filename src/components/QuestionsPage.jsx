import { PictureOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Input, Select, Space, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { listQuestions, loadMeta, PAGE_SIZE, setActive } from '../lib/questions'
import { S } from '../lib/strings'
import MathText from './MathText'
import QuestionDrawer from './QuestionDrawer'

const STATUS_OPTIONS = [
  { value: 'all', label: S.all },
  { value: 'active', label: S.active },
  { value: 'passive', label: S.passive },
]

function snippet(text) {
  const plain = (text ?? '').replace(/\s+/g, ' ')
  return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain
}

export default function QuestionsPage() {
  const { message } = App.useApp()
  const [meta, setMeta] = useState(null)
  const [metaError, setMetaError] = useState(null)
  const [filters, setFilters] = useState({ subjectId: undefined, topicId: undefined, status: 'all', search: '' })
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: null, rows: [], total: 0, error: null })
  const [editing, setEditing] = useState({ open: false, id: null })

  useEffect(() => {
    loadMeta().then(setMeta).catch((e) => setMetaError(e.message))
  }, [])

  const topicName = useMemo(() => new Map((meta?.leaves ?? []).map((t) => [t.id, t.name])), [meta])
  const subjectTopicIds = useMemo(
    () => (filters.subjectId && meta ? meta.leaves.filter((t) => t.subject_id === filters.subjectId).map((t) => t.id) : undefined),
    [filters.subjectId, meta],
  )

  // The list is "loading" while the last result belongs to other parameters; no state is set synchronously in the effect.
  const key = JSON.stringify([subjectTopicIds, filters.topicId, filters.status, filters.search, page, reload])
  const loading = Boolean(meta) && result.key !== key

  useEffect(() => {
    if (!meta) return undefined
    let alive = true
    listQuestions({ subjectTopicIds, topicId: filters.topicId, status: filters.status, search: filters.search, page })
      .then((r) => alive && setResult({ key, rows: r.rows, total: r.total, error: null }))
      .catch((e) => alive && setResult({ key, rows: [], total: 0, error: e.message }))
    return () => {
      alive = false
    }
  }, [key, meta]) // eslint-disable-line react-hooks/exhaustive-deps

  const error = metaError ?? result.error
  const data = result

  function change(patch) {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const refresh = () => setReload((n) => n + 1)
  const patchRow = (id, patch) =>
    setResult((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))

  async function toggle(row, value) {
    // optimistic: flip immediately, undo when the server refuses
    patchRow(row.id, { is_active: value })
    try {
      await setActive(row.id, value)
      message.success(value ? S.activated : S.deactivated)
    } catch (e) {
      patchRow(row.id, { is_active: !value })
      message.error(e.message)
    }
  }

  const columns = [
    { title: S.code, dataIndex: 'code', width: 110, render: (c) => <Typography.Text strong>{c}</Typography.Text> },
    { title: S.topic, dataIndex: 'topic_id', width: 220, render: (id) => topicName.get(id) ?? id },
    { title: S.type, dataIndex: 'type', width: 120, render: (t) => <Tag>{S.types[t] ?? t}</Tag> },
    { title: S.difficulty, dataIndex: 'difficulty', width: 90, align: 'center' },
    {
      title: S.question,
      dataIndex: 'body',
      render: (b) => <MathText text={snippet(b)} />,
    },
    {
      title: S.image,
      width: 70,
      align: 'center',
      render: (_, r) =>
        r.image_path || r.solution_image_path ? (
          <Tooltip title={[r.image_path, r.solution_image_path].filter(Boolean).join(', ')}>
            <PictureOutlined />
          </Tooltip>
        ) : null,
    },
    {
      title: S.active,
      dataIndex: 'is_active',
      width: 90,
      align: 'center',
      render: (v, r) => <span onClick={(e) => e.stopPropagation()}><Switch checked={v} onChange={(val) => toggle(r, val)} size="small" /></span>,
    },
  ]

  const topicChoices = (meta?.leaves ?? []).filter((t) => !filters.subjectId || t.subject_id === filters.subjectId)

  return (
    <>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {S.questions} <Typography.Text type="secondary" style={{ fontSize: 14 }}>{S.total(data.total)}</Typography.Text>
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ open: true, id: null })} disabled={!meta}>
          {S.newQuestion}
        </Button>
      </Flex>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={S.subject}
          style={{ width: 180 }}
          value={filters.subjectId}
          options={(meta?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => change({ subjectId: v, topicId: undefined })}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={S.topic}
          style={{ width: 280 }}
          value={filters.topicId}
          options={topicChoices.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(v) => change({ topicId: v })}
        />
        <Select style={{ width: 130 }} value={filters.status} options={STATUS_OPTIONS} onChange={(v) => change({ status: v })} />
        <Input.Search allowClear placeholder={S.search} style={{ width: 280 }} onSearch={(v) => change({ search: v })} />
      </Space>

      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${S.loadFailed}: ${error}`}
          action={<Button size="small" onClick={refresh}>{S.retry}</Button>}
        />
      )}

      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={data.rows}
        scroll={{ x: 900 }}
        onRow={(r) => ({ onClick: () => setEditing({ open: true, id: r.id }), style: { cursor: 'pointer' } })}
        pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
      />

      {meta && (
        <QuestionDrawer
          open={editing.open}
          questionId={editing.id}
          meta={meta}
          onClose={() => setEditing({ open: false, id: null })}
          onSaved={refresh}
        />
      )}
    </>
  )
}
