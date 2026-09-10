-- Harden RPC/function privileges introduced by previous migrations without rewriting history.
-- App-callable RPCs are authenticated-only. Internal SECURITY DEFINER helpers are not
-- directly executable by client roles.

revoke execute on function public.sync_upsert_row(text, jsonb) from public, anon;
revoke execute on function public.sync_soft_delete(text, uuid) from public, anon;
revoke execute on function public.delete_own_data() from public, anon;

revoke execute on function public.sync_table_columns(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.sync_upsert_row(text, jsonb) to authenticated;
grant execute on function public.sync_soft_delete(text, uuid) to authenticated;
grant execute on function public.delete_own_data() to authenticated;

-- Supabase Auth may use this role in managed environments. The trigger itself is the
-- intended entrypoint; this conditional grant avoids exposing the function to app roles.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;
end $$;
