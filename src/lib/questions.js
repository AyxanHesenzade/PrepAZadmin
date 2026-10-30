import { IMAGE_BUCKET, supabase } from './supabase'

export const LETTERS = ['A', 'B', 'C', 'D', 'E']
export const PAGE_SIZE = 20
const LIST_COLUMNS = 'id, code, topic_id, type, body, difficulty, is_active, image_path, solution_image_path'

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/** Is the signed-in user in the admins table? (RLS lets a user read only their own row.) */
export async function isAdmin(userId) {
  const data = check(await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle())
  return Boolean(data)
}

/** Subjects and topics. Topics: sections have parent_id null, the questions point to the leaf topics below them. */
export async function loadMeta() {
  const subjects = check(await supabase.from('subjects').select('id, slug, name, sort_order').order('sort_order'))
  const topics = check(await supabase.from('topics').select('id, subject_id, parent_id, name, sort_order').order('sort_order'))
  const sections = new Map(topics.filter((t) => t.parent_id === null).map((t) => [t.id, t]))
  const leaves = topics
    .filter((t) => t.parent_id !== null)
    .map((t) => ({ ...t, section: sections.get(t.parent_id)?.name ?? '' }))
  return { subjects, leaves }
}

export async function listQuestions({ subjectTopicIds, topicId, status, search, page }) {
  let q = supabase.from(`questions`).select(LIST_COLUMNS, { count: 'exact' })
  if (topicId) q = q.eq('topic_id', topicId)
  else if (subjectTopicIds) q = q.in('topic_id', subjectTopicIds)
  if (status === 'active') q = q.eq('is_active', true)
  if (status === 'passive') q = q.eq('is_active', false)
  const term = search?.trim().replace(/[%,()]/g, ' ')
  if (term) q = q.or(`code.ilike.%${term}%,body.ilike.%${term}%`)
  const from = (page - 1) * PAGE_SIZE
  const { data, error, count } = await q.order('code').range(from, from + PAGE_SIZE - 1)
  if (error) throw new Error(error.message)
  return { rows: data, total: count ?? 0 }
}

export async function getQuestion(id) {
  return check(await supabase.from('questions').select('*').eq('id', id).single())
}

/** Questions whose text starts the same way (to warn about a possible duplicate). Formulas and extra spaces are ignored. */
export async function findSimilar(body, excludeId) {
  const key = (body ?? '').replace(/\$[^$]*\$/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
  if (key.length < 15) return []
  const term = key.replace(/[%,()_\\]/g, ' ')
  let q = supabase.from('questions').select('id, code, body').ilike('body', `%${term}%`).limit(3)
  if (excludeId) q = q.neq('id', excludeId)
  return check(await q)
}

export async function setActive(id, isActive) {
  check(await supabase.from('questions').update({ is_active: isActive }).eq('id', id).select('id').single())
}

/** Next free code for a subject, e.g. KIM-0241. The prefix is the first 3 letters of the subject slug. */
export async function nextCode(subject) {
  const prefix = subject.slug.slice(0, 3).toUpperCase()
  const rows = check(
    await supabase.from('questions').select('code').like('code', `${prefix}-%`).order('code', { ascending: false }).limit(1),
  )
  const last = rows[0]?.code?.match(/-(\d+)$/)?.[1]
  return `${prefix}-${String((last ? Number(last) : 0) + 1).padStart(4, '0')}`
}

/** Form values -> database row. Options only for closed questions; numeric answers use a dot. */
export function toRow(values) {
  const closed = values.type === 'qapali'
  const answer = values.type === 'aciq_eded' ? String(values.correct_answer).trim().replace(',', '.') : values.correct_answer
  return {
    topic_id: values.topic_id,
    type: values.type,
    body: (values.body ?? '').trim(), // empty for image-only questions
    options: closed ? Object.fromEntries(LETTERS.map((l) => [l, (values[`opt_${l}`] ?? '').trim()])) : null,
    correct_answer: answer,
    difficulty: values.difficulty,
    solution: values.solution?.trim() || null,
    image_path: values.image_path || null,
    solution_image_path: values.solution_image_path || null,
    source: values.source.trim(),
    source_ref: values.source_ref?.trim() || null,
    year: values.year ?? null,
    groups: values.groups ?? [],
    is_active: values.is_active,
  }
}

/** Database row -> form values. */
export function toForm(row) {
  const opts = row.options ?? {}
  return {
    ...row,
    ...Object.fromEntries(LETTERS.map((l) => [`opt_${l}`, opts[l] ?? ''])),
  }
}

export async function createQuestion(code, values) {
  const row = { ...toRow(values), code, exam_levels: ['qebul'] }
  return check(await supabase.from('questions').insert(row).select('*').single())
}

export async function updateQuestion(id, values) {
  return check(await supabase.from('questions').update(toRow(values)).eq('id', id).select('*').single())
}

const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export function imageProblem(file) {
  return IMAGE_TYPES[file.type] && file.size <= MAX_IMAGE_BYTES ? null : 'invalid'
}

/** Uploads to the bucket under CODE.ext (question) or CODE_izah.ext (solution), replacing an older file. Returns the path. */
export async function uploadImage(code, kind, file) {
  const path = `${code}${kind === 'solution' ? '_izah' : ''}.${IMAGE_TYPES[file.type]}`
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  return path
}

export async function signedImageUrl(path) {
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 3600)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
