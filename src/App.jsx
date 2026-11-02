import { LogoutOutlined } from '@ant-design/icons'
import { Alert, Button, Layout, Result, Space, Spin, Tabs, Typography } from 'antd'
import { useEffect, useState } from 'react'
import Login from './components/Login'
import QuestionsPage from './components/QuestionsPage'
import ReportsPage from './components/ReportsPage'
import SettingsPage from './components/SettingsPage'
import TeachersPage from './components/TeachersPage'
import UsersPage from './components/UsersPage'
import { isAdmin } from './lib/questions'
import { isConfigured, supabase } from './lib/supabase'
import { S } from './lib/strings'

const signOut = () => supabase.auth.signOut()

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [check, setCheck] = useState(null) // { userId, admin, error } of the last admin check

  useEffect(() => {
    if (!isConfigured) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return
    isAdmin(userId)
      .then((admin) => setCheck({ userId, admin, error: null }))
      .catch((e) => setCheck({ userId, admin: false, error: e.message }))
  }, [userId])

  if (!isConfigured) return <Alert type="error" showIcon message={S.configMissing} style={{ margin: 24 }} />
  if (session === undefined) return <Spin fullscreen />
  if (!session) return <Login />

  const result = check?.userId === userId ? check : null // a result of another user does not count
  if (!result) return <Spin fullscreen />
  if (result.error) {
    return <Result status="error" title={S.loadFailed} subTitle={result.error} extra={<Button onClick={signOut}>{S.signOut}</Button>} />
  }
  if (!result.admin) {
    return <Result status="403" title={S.notAdminTitle} subTitle={S.notAdminText} extra={<Button onClick={signOut}>{S.signOut}</Button>} />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Typography.Text strong style={{ color: '#fff', fontSize: 18 }}>
          {S.appName}
        </Typography.Text>
        <Space>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)' }}>{session.user.email}</Typography.Text>
          <Button ghost icon={<LogoutOutlined />} onClick={signOut}>
            {S.signOut}
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Tabs
          items={[
            { key: 'questions', label: S.questions, children: <QuestionsPage /> },
            { key: 'reports', label: S.reports, children: <ReportsPage /> },
            { key: 'teachers', label: S.teachers, children: <TeachersPage /> },
            { key: 'users', label: S.users, children: <UsersPage /> },
            { key: 'settings', label: S.settings, children: <SettingsPage /> },
          ]}
        />
      </Layout.Content>
    </Layout>
  )
}
