import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { S } from '../lib/strings'

export default function Login() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit({ email, password }) {
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) setError(err.message.toLowerCase().includes('invalid') ? S.invalidCredentials : err.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <Card style={{ width: 360, maxWidth: '100%' }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {S.signInTitle}
        </Typography.Title>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item name="email" label={S.email} rules={[{ required: true, type: 'email' }]}>
            <Input autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item name="password" label={S.password} rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {S.signIn}
          </Button>
        </Form>
      </Card>
    </div>
  )
}
