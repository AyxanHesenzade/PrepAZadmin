import { S } from './strings'
import { supabase } from './supabase'

/** All accounts, newest first. Needs supabase/admin_list_users.sql to be run once. */
export async function listUsers() {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw new Error(error.code === 'PGRST202' ? S.usersSetupMissing : error.message)
  return data
}

export function countUsers(rows) {
  const admins = rows.filter((row) => row.is_admin).length
  return { total: rows.length, admins, users: rows.length - admins }
}

/** role: 'all', 'admin' or 'user'. term matches the e-mail or phone. */
export function filterUsers(rows, role, term) {
  const needle = term.trim().toLowerCase()
  return rows.filter((row) => {
    if (role === 'admin' && !row.is_admin) return false
    if (role === 'user' && row.is_admin) return false
    return !needle || (row.contact ?? '').toLowerCase().includes(needle)
  })
}
