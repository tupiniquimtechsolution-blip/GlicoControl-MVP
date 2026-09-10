--@section t-rpc-grants
begin;
do $$
begin
  if has_function_privilege('anon', 'public.sync_upsert_row(text,jsonb)', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: anon executa sync_upsert_row';
  end if;
  if has_function_privilege('anon', 'public.sync_soft_delete(text,uuid)', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: anon executa sync_soft_delete';
  end if;
  if has_function_privilege('anon', 'public.delete_own_data()', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: anon executa delete_own_data';
  end if;
  if not has_function_privilege('authenticated', 'public.sync_upsert_row(text,jsonb)', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: authenticated sem sync_upsert_row';
  end if;
  if not has_function_privilege('authenticated', 'public.sync_soft_delete(text,uuid)', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: authenticated sem sync_soft_delete';
  end if;
  if not has_function_privilege('authenticated', 'public.delete_own_data()', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: authenticated sem delete_own_data';
  end if;
  if has_function_privilege('authenticated', 'public.sync_table_columns(text)', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: helper interno exposto a authenticated';
  end if;
  if has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') then
    raise exception 'FALHA T-RPC-GRANTS: trigger helper exposto a authenticated';
  end if;
end $$;

set local role anon;
do $$
begin
  begin
    perform public.sync_upsert_row('glucose_measurements', '{}'::jsonb);
    raise exception 'FALHA T-RPC-GRANTS: chamada real anon foi aceita';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;
select 'PASS T-RPC-GRANTS privilégios mínimos das RPCs' as pass;
