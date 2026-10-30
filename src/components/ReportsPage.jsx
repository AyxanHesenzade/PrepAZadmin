import { DeleteOutlined } from '@ant-design/icons'
import { Alert, App, Button, Flex, Input, Popconfirm, Segmented, Select, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { deleteReport, formatDate, listReports, STATUSES, updateReport } from '../lib/reports'
import { S } from '../lib/strings'

const STATUS_COLOR = { new: 'red', seen: 'gold', done: 'green' }

function NoteEditor({ report, onSaved }) {
  const { message } = App.useApp()
  const [note, setNote] = useState(report.admin_note ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateReport(report.id, { admin_note: note })
      message.success(S.saved)
      onSaved()
    } catch (e) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Flex vertical gap={8} style={{ maxWidth: 640 }}>
      <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{report.message}</Typography.Paragraph>
      <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={S.adminNote} autoSize={{ minRows: 2 }} />
      <div>
        <Button onClick={save} loading={saving}>
          {S.saveNote}
        </Button>
      </div>
    </Flex>
  )
}

export default function ReportsPage() {
  const { message } = App.useApp()
  const [status, setStatus] = useState('new')
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: null, rows: [], error: null })

  const key = `${status}|${reload}`
  const loading = result.key !== key

  useEffect(() => {
    let alive = true
    listReports(status)
      .then((rows) => alive && setResult({ key, rows, error: null }))
      .catch((e) => alive && setResult({ key, rows: [], error: e.message }))
    return () => {
      alive = false
    }
  }, [key, status])

  const refresh = () => setReload((n) => n + 1)

  async function changeStatus(row, value) {
    try {
      await updateReport(row.id, { status: value })
      refresh()
    } catch (e) {
      message.error(e.message)
    }
  }

  async function remove(row) {
    try {
      await deleteReport(row.id)
      message.success(S.removedReport)
      refresh()
    } catch (e) {
      message.error(e.message)
    }
  }

  const columns = [
    { title: S.date, dataIndex: 'created_at', width: 150, render: formatDate },
    {
      title: S.type,
      dataIndex: 'kind',
      width: 130,
      render: (kind, row) =>
        kind === 'question' ? (
          <>
            <Tag color="blue">{S.reportQuestion}</Tag>
            <br />
            <Typography.Text copyable>{row.question_code}</Typography.Text>
          </>
        ) : (
          <Tag color="purple">{S.reportApp}</Tag>
        ),
    },
    {
      title: S.reportMessage,
      dataIndex: 'message',
      render: (text, row) => (
        <>
          {text.length > 140 ? `${text.slice(0, 140)}…` : text}
          {row.admin_note && (
            <>
              <br />
              <Typography.Text type="secondary">↳ {row.admin_note}</Typography.Text>
            </>
          )}
        </>
      ),
    },
    { title: S.appVersion, dataIndex: 'app_version', width: 100 },
    {
      title: S.status,
      dataIndex: 'status',
      width: 140,
      render: (value, row) => (
        <Select
          value={value}
          size="small"
          style={{ width: 120 }}
          onChange={(v) => changeStatus(row, v)}
          options={STATUSES.map((s) => ({ value: s, label: <Tag color={STATUS_COLOR[s]}>{S.reportStatus[s]}</Tag> }))}
        />
      ),
    },
    {
      title: '',
      width: 56,
      render: (_, row) => (
        <Popconfirm title={S.removeReportConfirm} okText={S.remove} okButtonProps={{ danger: true }} cancelText={S.cancel} onConfirm={() => remove(row)}>
          <Button danger type="text" icon={<DeleteOutlined />} aria-label={S.remove} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {S.reports}
      </Typography.Title>
      <Typography.Text type="secondary">{S.reportsHint}</Typography.Text>
      <Segmented
        value={status}
        onChange={setStatus}
        options={[...STATUSES.map((s) => ({ value: s, label: S.reportStatus[s] })), { value: 'all', label: S.all }]}
      />
      {result.error && <Alert type="error" showIcon message={S.loadFailed} description={result.error} action={<Button onClick={refresh}>{S.retry}</Button>} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={result.rows}
        loading={loading}
        pagination={false}
        expandable={{ expandedRowRender: (row) => <NoteEditor key={row.id} report={row} onSaved={refresh} />, rowExpandable: () => true }}
        scroll={{ x: 800 }}
      />
    </Flex>
  )
}
