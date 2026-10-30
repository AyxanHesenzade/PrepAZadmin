import { supabase } from './supabase'

/** Date input value: YYYY-MM-DD (the same as the database date). */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(text) {
  if (!DATE_PATTERN.test(text ?? '')) return false
  const d = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text
}

export async function loadPeriods() {
  const { data, error } = await supabase.from('exam_periods').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return data
}

export async function savePeriod(id, { exam_date: examDate, is_active: isActive }) {
  if (!isValidDate(examDate)) throw new Error('Tarix YYYY-AA-GG formatında olmalıdır')
  const { error } = await supabase.from('exam_periods').update({ exam_date: examDate, is_active: isActive }).eq('id', id)
  if (error) throw new Error(error.message)
}
