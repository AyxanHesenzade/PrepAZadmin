import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

export const isConfigured = Boolean(url && key)

// Only the public URL and publishable key live here; Row Level Security (is_admin()) protects the data.
export const supabase = createClient(url || 'http://localhost', key || 'missing')

export const IMAGE_BUCKET = 'question-images'
export const TEACHER_PHOTO_BUCKET = 'teacher-photos'
