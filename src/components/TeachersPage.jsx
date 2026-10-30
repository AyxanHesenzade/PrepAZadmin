import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, App, Avatar, Button, Flex, Popconfirm, Switch, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { deleteTeacher, listTeachers, setTeacherActive, teacherPhotoUrl } from '../lib/teachers'
import { S } from '../lib/strings'
import TeacherDrawer from './TeacherDrawer'

export default function TeachersPage() {
  const { message } = App.useApp()
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: null, rows: [], error: null })
  const [editing, setEditing] = useState({ open: false, row: null })

  // "loading" while the last result belongs to an older reload counter (no synchronous setState in the effect)
  const loading = result.key !== reload

  useEffect(() => {
    let alive = true
    listTeachers()
      .then((rows) => alive && setResult({ key: reload, rows, error: null }))
      .catch((e) => alive && setResult({ key: reload, rows: [], error: e.message }))
    return () => {
      alive = false
    }
  }, [reload])

  async function toggle(row, value) {
    try {
      await setTeacherActive(row.id, value)
      message.success(value ? S.activated : S.deactivated)
      setReload((n) => n + 1)
    } catch (e) {
      message.error(e.message)
    }
  }

  async function remove(row) {
    try {
      await deleteTeacher(row)
      message.success(S.removed)
      setReload((n) => n + 1)
    } catch (e) {
      message.error(e.message)
    }
  }

  const columns = [
    {
      title: S.photo,
      dataIndex: 'photo_path',
      width: 72,
      render: (path, row) => <Avatar size={44} src={teacherPhotoUrl(path)}>{row.full_name.slice(0, 1)}</Avatar>,
    },
    {
      title: S.fullName,
      dataIndex: 'full_name',
      render: (name, row) => (
        <>
          <Typography.Text strong>{name}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{row.subject_label}</Typography.Text>
        </>
      ),
    },
    { title: S.lessonMode, dataIndex: 'lesson_mode', width: 110, render: (m) => S.modes[m] },
    { title: S.phone, dataIndex: 'phone', width: 160 },
    {
      title: S.consent,
      dataIndex: 'consent',
      width: 120,
      render: (c) => (c ? <Tag color="green">{S.consentYes}</Tag> : <Tag color="red">{S.consentNo}</Tag>),
    },
    { title: S.order, dataIndex: 'sort_order', width: 80 },
    {
      title: S.status,
      dataIndex: 'is_active',
      width: 100,
      render: (active, row) => <Switch checked={active} onChange={(v) => toggle(row, v)} />,
    },
    {
      title: '',
      width: 64,
      render: (_, row) => (
        <Popconfirm title={S.removeTeacherConfirm} okText={S.remove} okButtonProps={{ danger: true }} cancelText={S.cancel} onConfirm={() => remove(row)}>
          <Button danger type="text" icon={<DeleteOutlined />} aria-label={S.remove} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {S.teachers}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ open: true, row: null })}>
          {S.newTeacher}
        </Button>
      </Flex>
      <Typography.Text type="secondary">{S.teachersHint}</Typography.Text>
      {result.error && (
        <Alert
          type="error"
          showIcon
          message={S.loadFailed}
          description={result.error}
          action={<Button onClick={() => setReload((n) => n + 1)}>{S.retry}</Button>}
        />
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={result.rows}
        loading={loading}
        pagination={false}
        onRow={(row) => ({ onClick: (e) => !e.target.closest('.ant-switch, .ant-btn, .ant-popover') && setEditing({ open: true, row }), style: { cursor: 'pointer' } })}
        scroll={{ x: 700 }}
      />
      {editing.open && (
        <TeacherDrawer
          key={editing.row?.id ?? 'new'}
          teacher={editing.row}
          onClose={() => setEditing({ open: false, row: null })}
          onSaved={() => {
            setEditing({ open: false, row: null })
            setReload((n) => n + 1)
          }}
        />
      )}
    </Flex>
  )
}
