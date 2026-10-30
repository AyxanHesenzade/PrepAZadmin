import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Drawer, Form, Input, InputNumber, Modal, Select, Space, Switch, Typography, Upload } from 'antd'
import { useState } from 'react'
import { LESSON_MODES, PHONE_PATTERN, photoProblem, saveTeacher, teacherPhotoUrl, uploadTeacherPhoto } from '../lib/teachers'
import { S } from '../lib/strings'

/** Photo field: value is the file name inside the teacher-photos bucket. A new file is uploaded right away; saving links it. */
function PhotoField({ value, onChange, name }) {
  const { message } = App.useApp()
  const [busy, setBusy] = useState(false)

  async function pick(file) {
    if (photoProblem(file)) {
      message.error(S.photoInvalid)
      return Upload.LIST_IGNORE
    }
    setBusy(true)
    try {
      onChange?.(await uploadTeacherPhoto(file))
      message.success(S.photoUploaded)
    } catch (e) {
      message.error(e.message)
    } finally {
      setBusy(false)
    }
    return Upload.LIST_IGNORE
  }

  return (
    <Space orientation="vertical" size={8}>
      <Avatar size={96} src={teacherPhotoUrl(value)}>
        {(name ?? '').slice(0, 1)}
      </Avatar>
      <Space>
        <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={pick}>
          <Button icon={<UploadOutlined />} loading={busy}>
            {S.uploadPhoto}
          </Button>
        </Upload>
        {value && (
          <Button icon={<DeleteOutlined />} danger onClick={() => onChange?.(null)}>
            {S.removePhoto}
          </Button>
        )}
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {S.photoRule}
      </Typography.Text>
    </Space>
  )
}

const DEFAULTS = { lesson_mode: 'both', consent: false, is_active: true, sort_order: 0 }

export default function TeacherDrawer({ teacher, onClose, onSaved }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const mode = Form.useWatch('lesson_mode', form) ?? (teacher?.lesson_mode ?? DEFAULTS.lesson_mode)
  const name = Form.useWatch('full_name', form) ?? teacher?.full_name

  function close() {
    if (!form.isFieldsTouched()) return onClose()
    Modal.confirm({ title: S.unsavedConfirm, okText: S.cancel, cancelText: S.keepEditing, onOk: onClose })
  }

  async function submit(values) {
    setSaving(true)
    try {
      await saveTeacher(teacher?.id ?? null, values)
      message.success(S.saved)
      onSaved()
    } catch (e) {
      message.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open
      size={520}
      title={teacher ? S.editTeacher : S.newTeacher}
      onClose={close}
      footer={
        <Space>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {S.save}
          </Button>
          <Button onClick={close}>{S.cancel}</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={teacher ?? DEFAULTS} onFinish={submit}>
        <Form.Item name="photo_path" label={S.photo}>
          <PhotoField name={name} />
        </Form.Item>
        <Form.Item name="full_name" label={S.fullName} rules={[{ required: true, whitespace: true, message: S.required }]}>
          <Input />
        </Form.Item>
        <Form.Item name="subject_label" label={S.subjectLabel} extra={S.subjectLabelHelp} rules={[{ required: true, whitespace: true, message: S.required }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lesson_mode" label={S.lessonMode} rules={[{ required: true, message: S.required }]}>
          <Select options={LESSON_MODES.map((m) => ({ value: m, label: S.modes[m] }))} />
        </Form.Item>
        {mode !== 'online' && (
          <Form.Item name="address" label={S.address} extra={S.addressHelp}>
            <Input />
          </Form.Item>
        )}
        <Form.Item
          name="phone"
          label={S.phone}
          extra={S.phoneHelp}
          rules={[{ required: true, message: S.required }, { pattern: PHONE_PATTERN, message: S.badPhone }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="about" label={S.about}>
          <Input.TextArea autoSize={{ minRows: 3 }} />
        </Form.Item>
        <Form.Item name="offer" label={S.offer} extra={S.offerHelp}>
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
        <Form.Item name="sort_order" label={S.order} extra={S.orderHelp}>
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="consent" label={S.consentLabel} extra={S.consentHelp} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="is_active" label={S.isActive} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
