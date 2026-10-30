import { Alert, App, Button, Card, Flex, Form, Input, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import ExamPeriodsCard from './ExamPeriodsCard'
import { compareVersions, loadConfig, saveConfig, URL_PATTERN, VERSION_PATTERN } from '../lib/appConfig'
import { S } from '../lib/strings'

export default function SettingsPage() {
  const [state, setState] = useState({ config: null, error: null })

  useEffect(() => {
    loadConfig()
      .then((config) => setState({ config, error: null }))
      .catch((e) => setState({ config: null, error: e.message }))
  }, [])

  if (state.error) return <Alert type="error" showIcon message={S.loadFailed} description={state.error} />
  if (!state.config) return <Spin />
  return <SettingsForm initial={state.config} />
}

function SettingsForm({ initial }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const min = Form.useWatch('min_version', form) ?? initial.min_version
  const latest = Form.useWatch('latest_version', form) ?? initial.latest_version
  const minAboveLatest = compareVersions(min, latest) === 1

  async function submit(values) {
    setSaving(true)
    try {
      await saveConfig(values)
      message.success(S.saved)
    } catch (e) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Flex vertical gap={16} style={{ maxWidth: 640 }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {S.settings}
      </Typography.Title>
      <Typography.Text type="secondary">{S.updateHint}</Typography.Text>
      <Card>
        <Form form={form} layout="vertical" initialValues={initial} onFinish={submit}>
          <Form.Item
            name="min_version"
            label={S.minVersion}
            extra={S.minVersionHelp}
            rules={[{ required: true, message: S.required }, { pattern: VERSION_PATTERN, message: S.badVersion }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="latest_version"
            label={S.latestVersion}
            extra={S.latestVersionHelp}
            rules={[{ required: true, message: S.required }, { pattern: VERSION_PATTERN, message: S.badVersion }]}
          >
            <Input />
          </Form.Item>
          {minAboveLatest && <Alert type="warning" showIcon message={S.minAboveLatest} style={{ marginBottom: 16 }} />}
          <Form.Item name="update_url" label={S.updateUrl} extra={S.updateUrlHelp} rules={[{ pattern: URL_PATTERN, message: S.badUrl }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            {S.save}
          </Button>
        </Form>
      </Card>
      <ExamPeriodsCard />
    </Flex>
  )
}
