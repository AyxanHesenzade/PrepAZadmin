import { describe, expect, it } from 'vitest'
import { countUsers, filterUsers } from './users'

const rows = [
  { id: '1', contact: 'Admin@prepaz.az', is_admin: true },
  { id: '2', contact: 'sagird@mail.az', is_admin: false },
  { id: '3', contact: null, is_admin: false },
]

describe('countUsers', () => {
  it('splits accounts into admins and users', () => {
    expect(countUsers(rows)).toEqual({ total: 3, admins: 1, users: 2 })
  })

  it('handles an empty list', () => {
    expect(countUsers([])).toEqual({ total: 0, admins: 0, users: 0 })
  })
})

describe('filterUsers', () => {
  const ids = (role, term) => filterUsers(rows, role, term).map((row) => row.id)

  it('filters by role', () => {
    expect(ids('all', '')).toEqual(['1', '2', '3'])
    expect(ids('admin', '')).toEqual(['1'])
    expect(ids('user', '')).toEqual(['2', '3'])
  })

  it('searches without case and skips accounts with no contact', () => {
    expect(ids('all', ' ADMIN@ ')).toEqual(['1'])
  })
})
