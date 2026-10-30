import { supabase } from './supabase'

export const STATUSES = ['new', 'seen', 'done']

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/** Newest first. status: 'all' or one of STATUSES. */
export async function listReports(status) {
  let q = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') q = q.eq('status', status)
  return check(await q)
}

/** Number of reports nobody has looked at yet. */
export async function countNew() {
  const { count, error } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function updateReport(id, patch) {
  const row = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.admin_note !== undefined) row.admin_note = patch.admin_note.trim() || null
  return check(await supabase.from('reports').update(row).eq('id', id).select('*').single())
}

export async function deleteReport(id) {
  check(await supabase.from('reports').delete().eq('id', id).select('id').single())
}

/** "2026-10-30T16:10:00Z" -> "30.10.2026 20:10" in the viewer's time zone. */
export function formatDate(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
