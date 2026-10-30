import { supabase } from './supabase'

/** Same rule as the database check: 0.0.1 or 0.0.1+2 (with build). */
export const VERSION_PATTERN = /^\d+\.\d+\.\d+(\+\d+)?$/
export const URL_PATTERN = /^https?:\/\//

/** Version text -> [major, minor, patch, build] (build 0 when missing); null if it is not a version. */
export function parseVersion(text) {
  const m = VERSION_PATTERN.exec((text ?? '').trim())
  if (!m) return null
  const [core, build] = text.trim().split('+')
  return [...core.split('.').map(Number), build ? Number(build) : 0]
}

/** -1, 0 or 1; null when one of them is not a version. */
export function compareVersions(a, b) {
  const x = parseVersion(a)
  const y = parseVersion(b)
  if (!x || !y) return null
  for (let i = 0; i < 4; i += 1) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1
  return 0
}

export async function loadConfig() {
  const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single()
  if (error) throw new Error(error.message)
  return data
}

export async function saveConfig(values) {
  const row = {
    min_version: values.min_version.trim(),
    latest_version: values.latest_version.trim(),
    update_url: (values.update_url ?? '').trim() || null,
  }
  const { data, error } = await supabase.from('app_config').update(row).eq('id', 1).select('*').single()
  if (error) throw new Error(error.message)
  return data
}
