import { supabase, TEACHER_PHOTO_BUCKET } from './supabase'

/** Same rule as the database check on teachers.phone. */
export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/

export const LESSON_MODES = ['in_person', 'online', 'both']

const PHOTO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_PHOTO_BYTES = 1024 * 1024 // the bucket limit

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/** All teachers, also hidden ones (RLS lets an admin read everything). */
export async function listTeachers() {
  return check(await supabase.from('teachers').select('*').order('sort_order').order('full_name'))
}

const clean = (text) => (text ?? '').trim() || null

/** Form values -> database row. An online teacher has no address. */
export function toRow(values) {
  return {
    full_name: (values.full_name ?? '').trim(),
    subject_label: (values.subject_label ?? '').trim(),
    lesson_mode: values.lesson_mode,
    address: values.lesson_mode === 'online' ? null : clean(values.address),
    phone: (values.phone ?? '').trim(),
    about: clean(values.about),
    offer: clean(values.offer),
    photo_path: values.photo_path || null,
    consent: Boolean(values.consent),
    is_active: Boolean(values.is_active),
    sort_order: values.sort_order ?? 0,
  }
}

export async function saveTeacher(id, values) {
  const row = toRow(values)
  const query = id ? supabase.from('teachers').update(row).eq('id', id) : supabase.from('teachers').insert(row)
  return check(await query.select('*').single())
}

export async function setTeacherActive(id, isActive) {
  check(await supabase.from('teachers').update({ is_active: isActive }).eq('id', id).select('id').single())
}

/** Deletes the teacher, then (best effort) the photo file if nobody else uses it. */
export async function deleteTeacher(teacher) {
  check(await supabase.from('teachers').delete().eq('id', teacher.id).select('id').single())
  if (!teacher.photo_path) return
  const { count } = await supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('photo_path', teacher.photo_path)
  if (!count) await supabase.storage.from(TEACHER_PHOTO_BUCKET).remove([teacher.photo_path])
}

export function photoProblem(file) {
  return PHOTO_TYPES[file.type] && file.size <= MAX_PHOTO_BYTES ? null : 'invalid'
}

/** Uploads under a new unique name (so the app never shows a cached older photo). Returns the file name. */
export async function uploadTeacherPhoto(file) {
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${PHOTO_TYPES[file.type]}`
  const { error } = await supabase.storage.from(TEACHER_PHOTO_BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw new Error(error.message)
  return path
}

export function teacherPhotoUrl(path) {
  return path ? supabase.storage.from(TEACHER_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl : undefined
}
