-- RPCs de sincronização: o servidor (dono do relógio e do row_version) decide LWW.
-- SEGURANÇA: allowlist de tabelas; colunas validadas no catálogo; user_id SEMPRE auth.uid()
-- (nunca o payload); conflito de dono bloqueado na cláusula do ON CONFLICT.
create or replace function public.sync_table_columns(p_table text)
returns table (column_name text, cast_type text)
language sql stable security definer set search_path = public as $$
  select a.attname::text,
         case
           when t.typcategory = 'A' then format('%I[]', (select et.typname from pg_type et where et.oid = t.typelem))
           else quote_ident(t.typname)
         end
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_type t on t.oid = a.atttypid
  where n.nspname = 'public' and c.relname = p_table and a.attnum > 0 and not a.attisdropped;
$$;
revoke all on function public.sync_table_columns(text) from public;

create or replace function public.sync_upsert_row(p_table text, p_payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['glucose_measurements','reminders','medications','medication_schedules','medication_logs','glucose_targets'];
  row_id uuid;
  proposed timestamptz;
  cols text[];
  insert_cols text;
  insert_vals text;
  update_set text;
  sql text;
  n int;
begin
  if not (p_table = any(allowed)) then
    return 'table-not-allowed';
  end if;
  row_id := nullif(p_payload->>'id', '')::uuid;
  if row_id is null then
    return 'missing-id';
  end if;
  proposed := coalesce(nullif(p_payload->>'_proposed_updated_at', '')::timestamptz, now());

  select array_agg(k) into cols
  from jsonb_object_keys(p_payload) k
  where k not in ('id','user_id','created_at','updated_at','row_version','deleted_at','_proposed_updated_at')
    and exists (select 1 from public.sync_table_columns(p_table) c where c.column_name = k);

  if cols is null or cardinality(cols) = 0 then
    return 'empty-payload';
  end if;

  select
    string_agg(format('%I', k), ', '),
    string_agg(format('($2->>%L)::%s', k, t.cast_type), ', '),
    string_agg(format('%1$I = excluded.%1$I', k), ', ')
  into insert_cols, insert_vals, update_set
  from unnest(cols) k
  join public.sync_table_columns(p_table) t on t.column_name = k;

  sql := format(
    'insert into public.%I (id, user_id, %s) values ($1, auth.uid(), %s)
     on conflict (id) do update set %s
     where public.%I.updated_at < $3 and public.%I.user_id = auth.uid()',
    p_table, insert_cols, insert_vals, update_set, p_table, p_table);
  begin
    execute sql using row_id, p_payload, proposed;
  exception when foreign_key_violation then
    return 'parent-missing';
  when check_violation or not_null_violation then
    return 'invalid-payload';
  end;

  get diagnostics n = row_count;
  if n > 0 then
    return 'applied';
  end if;
  if exists (select 1 from public.glucose_measurements where id = row_id)
     or exists (select 1 from public.reminders where id = row_id)
     or exists (select 1 from public.medications where id = row_id)
     or exists (select 1 from public.medication_schedules where id = row_id)
     or exists (select 1 from public.medication_logs where id = row_id)
     or exists (select 1 from public.glucose_targets where id = row_id)
  then
    return 'skipped-stale';
  end if;
  return 'not-applied';
end $$;

create or replace function public.sync_soft_delete(p_table text, p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['glucose_measurements','reminders','medications','medication_schedules','medication_logs','glucose_targets'];
  n int;
begin
  if not (p_table = any(allowed)) then return 'table-not-allowed'; end if;
  execute format('update public.%I set deleted_at = now(), row_version = row_version + 1 where id = $1 and user_id = auth.uid() and deleted_at is null', p_table) using p_id;
  get diagnostics n = row_count;
  return case when n > 0 then 'applied' else 'not-found' end;
end $$;

grant execute on function public.sync_upsert_row(text, jsonb) to authenticated;
grant execute on function public.sync_soft_delete(text, uuid) to authenticated;
