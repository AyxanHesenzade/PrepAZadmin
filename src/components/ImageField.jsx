import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Image, Space, Typography, Upload } from 'antd'
import { useEffect, useState } from 'react'
import { imageProblem, signedImageUrl, uploadImage } from '../lib/questions'
import { S } from '../lib/strings'

/**
 * Form field holding an image path in the bucket (value / onChange come from Form.Item).
 * kind: 'question' | 'solution'. A new file is uploaded right away under CODE.ext; saving the form links it.
 */
export default function ImageField({ value, onChange, code, kind, disabled }) {
  const { message } = App.useApp()
  const [resolved, setResolved] = useState({ path: null, url: null }) // signed link of one path
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!value) return undefined
    let alive = true
    signedImageUrl(value)
      .then((url) => alive && setResolved({ path: value, url }))
      .catch(() => alive && setResolved({ path: value, url: null }))
    return () => {
      alive = false
    }
  }, [value])

  const url = resolved.path === value ? resolved.url : null

  async function pick(file) {
    if (imageProblem(file)) {
      message.error(S.imageInvalid)
      return Upload.LIST_IGNORE
    }
    setBusy(true)
    try {
      const path = await uploadImage(code, kind, file)
      // same path again (replaced file): force a fresh link
      if (path === value) setResolved({ path, url: await signedImageUrl(path) })
      onChange?.(path)
      message.success(S.imageUploaded)
    } catch (e) {
      message.error(e.message)
    } finally {
      setBusy(false)
    }
    return Upload.LIST_IGNORE
  }

  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      {url ? <Image src={url} style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain' }} /> : <Typography.Text type="secondary">{value ? value : S.noImage}</Typography.Text>}
      <Space>
        <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={pick} disabled={disabled || !code}>
          <Button icon={<UploadOutlined />} loading={busy} disabled={disabled || !code}>
            {S.uploadImage}
          </Button>
        </Upload>
        {value && (
          <Button icon={<DeleteOutlined />} danger onClick={() => onChange?.(null)} disabled={disabled}>
            {S.removeImage}
          </Button>
        )}
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {S.imageRule}
      </Typography.Text>
    </Space>
  )
}
