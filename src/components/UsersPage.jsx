import { Alert, Button, Card, Flex, Input, Segmented, Statistic, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { formatDate } from '../lib/reports'
import { S } from '../lib/strings'
import { countUsers, filterUsers, listUsers } from '../lib/users'

export default function UsersPage() {
  const [role, setRole] = useState('all')
  const [term, setTerm] = useState('')
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: null, rows: [], error: null })

  const loading = result.key !== reload

  useEffect(() => {
    let alive = true
    listUsers()
      .then((rows) => alive && setResult({ key: reload, rows, error: null }))
      .catch((e) => alive && setResult({ key: reload, rows: [], error: e.message }))
    return () => {
      alive = false
    }
  }, [reload])

  const counts = countUsers(result.rows)

  const columns = [
    { title: S.userContact, dataIndex: 'contact', render: (contact) => contact ?? '—' },
    {
      title: S.userRole,
      dataIndex: 'is_admin',
      width: 170,
      render: (isAdmin, row) => (
        <>
          <Tag color={isAdmin ? 'gold' : 'blue'}>{isAdmin ? S.userRoleAdmin : S.userRoleUser}</Tag>
          {row.is_anonymous && <Tag>{S.userAnonymous}</Tag>}
        </>
      ),
    },
    { title: S.userCreated, dataIndex: 'created_at', width: 170, render: formatDate },
    { title: S.userLastSignIn, dataIndex: 'last_sign_in_at', width: 170, render: (iso) => (iso ? formatDate(iso) : '—') },
  ]

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {S.users}
      </Typography.Title>
      <Flex gap={16} wrap>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic title={S.usersTotal} value={counts.total} loading={loading} />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic title={S.usersPlain} value={counts.users} loading={loading} />
        </Card>
        <Card size="small" style={{ minWidth: 160 }}>
          <Statistic title={S.usersAdmins} value={counts.admins} loading={loading} />
        </Card>
      </Flex>
      <Flex gap={16} wrap>
        <Segmented
          value={role}
          onChange={setRole}
          options={[
            { value: 'all', label: S.all },
            { value: 'user', label: S.usersPlain },
            { value: 'admin', label: S.usersAdmins },
          ]}
        />
        <Input.Search allowClear value={term} onChange={(e) => setTerm(e.target.value)} placeholder={S.usersSearch} style={{ maxWidth: 320 }} />
      </Flex>
      {result.error && (
        <Alert type="error" showIcon message={S.loadFailed} description={result.error} action={<Button onClick={() => setReload((n) => n + 1)}>{S.retry}</Button>} />
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filterUsers(result.rows, role, term)}
        loading={loading}
        pagination={{ pageSize: 50, showSizeChanger: false, hideOnSinglePage: true }}
        scroll={{ x: 700 }}
      />
    </Flex>
  )
}
