-- Run once in the Supabase SQL Editor. Safe to run again.
-- The panel only has the publishable key, so it cannot read auth.users itself.
-- This function reads it for the panel and refuses anyone who is not in public.admins.
-- Returns jsonb (one value) so PostgREST's row limit cannot cut the list short.

create or replace function public.admin_list_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'contact', coalesce(u.email::text, u.phone::text),
          'created_at', u.created_at,
          'last_sign_in_at', u.last_sign_in_at,
          'is_anonymous', u.is_anonymous,
          'is_admin', a.user_id is not null
        )
        order by u.created_at desc
      ),
      '[]'::jsonb
    )
    from auth.users u
    left join public.admins a on a.user_id = u.id
  );
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
