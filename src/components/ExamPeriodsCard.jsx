import { Alert, App, Button, Card, Flex, Input, Spin, Switch, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { isValidDate, loadPeriods, savePeriod } from '../lib/examPeriods'
import { S } from '../lib/strings'

export default function ExamPeriodsCard() {
  const [state, setState] = useState({ periods: null, error: null })

  useEffect(() => {
    loadPeriods()
      .then((periods) => setState({ periods, error: null }))
      .catch((e) => setState({ periods: null, error: e.message }))
  }, [])

  if (state.error) return <Alert type="error" showIcon message={S.loadFailed} description={state.error} />
  if (!state.periods) return <Spin />
  return (
    <Card title={S.examPeriods}>
      <Flex vertical gap={12}>
        <Typography.Text type="secondary">{S.examPeriodsHint}</Typography.Text>
        {state.periods.map((p) => (
          <PeriodRow key={p.id} period={p} />
        ))}
      </Flex>
    </Card>
  )
}

function PeriodRow({ period }) {
  const { message } = App.useApp()
  const [date, setDate] = useState(period.exam_date)
  const [active, setActive] = useState(period.is_active)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await savePeriod(period.id, { exam_date: date, is_active: active })
      message.success(S.saved)
    } catch (e) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Flex gap={12} align="center" wrap>
      <Typography.Text strong style={{ minWidth: 100 }}>
        {period.name}
      </Typography.Text>
      <Input
        value={date}
        onChange={(e) => setDate(e.target.value.trim())}
        placeholder="YYYY-AA-GG"
        status={isValidDate(date) ? undefined : 'error'}
        style={{ width: 150 }}
      />
      <Switch checked={active} onChange={setActive} checkedChildren={S.active} unCheckedChildren={S.passive} />
      <Button type="primary" onClick={save} loading={saving} disabled={!isValidDate(date)}>
        {S.save}
      </Button>
    </Flex>
  )
}
