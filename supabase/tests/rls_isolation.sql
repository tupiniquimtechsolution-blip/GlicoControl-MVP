-- ============================================================================
-- FASE 1 gate de segurança: RLS + triggers + sync RPC.
-- Cada seção é uma transação própria; `--@section NOME` delimita.
-- `scripts/rls/run-local.mjs` executa as seções com PGlite (Postgres 16 real):
-- falha em qualquer seção → exit≠0; sucesso imprime PASS por seção.
-- ============================================================================

--@section setup-users
begin;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');
insert into public.glucose_measurements (id, user_id, value, unit, measured_at, local_date, local_time, tz_name, context)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 120, 'mg/dL',
        '2026-09-09T08:00:00Z', '2026-09-09', '08:00:00', 'UTC', 'before_breakfast');
insert into public.medications (id, user_id, name, dose_text)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Metformina', '1cp 850mg');
commit;
select 'PASS T-TRIGGER handle_new_user + setup' as pass,
       (select count(*) from public.profiles)::int as profiles_created;

--@section t-coverage
begin;
do $$
declare t text; cnt int;
begin
  foreach t in array array['profiles','glucose_measurements','reminders','medications','medication_schedules','medication_logs','glucose_targets'] loop
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
                   where n.nspname='public' and c.relname=t and c.relrowsecurity) then
      raise exception 'FALHA T-COVERAGE: % sem RLS habilitado', t;
    end if;
    select count(*) into cnt from pg_policies where schemaname='public' and tablename=t;
    if cnt < 3 then raise exception 'FALHA T-COVERAGE: % tem apenas % policies', t, cnt; end if;
  end loop;
  if exists (select 1 from pg_policies where schemaname='public' and tablename like 'medication%' and policyname like '%for all%') then
    raise notice 'ok';
  end if;
end $$;
commit;
select 'PASS T-COVERAGE RLS+policies em todas as 7 tabelas' as pass;

--@section t1-t3-read-insert
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'FALHA T1: A não vê exatamente 1 profile (o próprio)'; end if;
  if (select count(*) from public.glucose_measurements) <> 0 then raise exception 'FALHA T1/T2: A vê linhas que não são suas'; end if;
end $$;
-- T1 ok; insere própria
insert into public.glucose_measurements (user_id, value, unit, measured_at, local_date, local_time, tz_name, context)
values ('11111111-1111-1111-1111-111111111111', 95, 'mg/dL', '2026-09-09T07:00:00Z', '2026-09-09', '07:00:00', 'America/Sao_Paulo', 'fasting');
do $$ begin
  begin
    insert into public.glucose_measurements (user_id, value, unit, measured_at, local_date, local_time, tz_name, context)
    values ('22222222-2222-2222-2222-222222222222', 80, 'mg/dL', '2026-09-09T07:00:00Z', '2026-09-09', '07:00:00', 'UTC', 'fasting');
    raise exception 'FALHA T3: insert com user_id de outra pessoa foi aceito';
  exception when insufficient_privilege then
    null;
  end;
end $$;
commit;
select 'PASS T1 leitura própria + T2 invisibilidade + T3 insert forjado' as pass;

--@section t4-t5-update-delete
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
update public.glucose_measurements set value=999 where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
delete from public.glucose_measurements where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
do $$ begin
  if (select value from public.glucose_measurements where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') <> 120 then
    raise exception 'FALHA T4/T5: linha de B visível/alterada para A';
  end if;
end $$;
commit;
begin;
do $$ begin
  if (select value from public.glucose_measurements where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') <> 120 then
    raise exception 'FALHA T4/T5: A alterou/excluiu linha de B';
  end if;
end $$;
commit;
select 'PASS T4/T5 update e delete cruzados sem efeito' as pass;

--@section t6-anon
begin;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.glucose_measurements;
    raise exception 'FALHA T6: anon consultou tabela de dados';
  exception when insufficient_privilege then
    null;
  end;
end $$;
commit;
select 'PASS T6 anon sem acesso' as pass;

--@section t7-t8
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$ begin
  begin
    insert into public.medication_logs (user_id, medication_id, action)
    values ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'taken');
    raise exception 'FALHA T7: log referenciou medication de OUTRO usuário';
  exception when foreign_key_violation then
    null;
  end;
  update public.profiles set display_name='hijack' where id='22222222-2222-2222-2222-222222222222';
  if (select count(*) from pg_policies p, public.profiles pr where p.tablename='profiles') < 3 then
    raise exception 'FALHA T8: policies de profiles ausentes';
  end if;
end $$;
commit;
begin;
do $$ begin
  if exists (select 1 from public.profiles where id='22222222-2222-2222-2222-222222222222' and display_name='hijack') then
    raise exception 'FALHA T8: A atualizou profile de B';
  end if;
end $$;
commit;
select 'PASS T7 FK composta / T8 profile alheio intocável' as pass;

--@section t-trigger-version
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$
declare v1 bigint; v2 bigint;
begin
  select row_version into v1 from public.glucose_measurements where user_id = auth.uid() limit 1;
  update public.glucose_measurements set note='rev1' where user_id = auth.uid() and note is null;
  select row_version into v2 from public.glucose_measurements where user_id = auth.uid() and note='rev1';
  if v2 <> v1 + 1 then raise exception 'FALHA T-TRIGGER: row_version não incrementou (%→%)', v1, v2; end if;
end $$;
commit;
select 'PASS T-TRIGGER row_version bumped' as pass;

--@section t-dedup
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$ begin
  begin
    insert into public.glucose_measurements (user_id, value, unit, measured_at, local_date, local_time, tz_name, context)
    values ('11111111-1111-1111-1111-111111111111', 96, 'mg/dL', '2026-09-09T07:00:30Z', '2026-09-09', '07:00:00', 'America/Sao_Paulo', 'fasting');
    raise exception 'FALHA T-DEDUP: duplicata mesmo minuto/contexto aceita';
  exception when unique_violation then
    null;
  end;
end $$;
commit;
select 'PASS T-DEDUP índice único parcial' as pass;

--@section t-sync
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$
declare st text; val numeric;
begin
  st := public.sync_upsert_row('glucose_measurements', jsonb_build_object(
    'id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'user_id', '22222222-2222-2222-2222-222222222222',
    'value', 101, 'unit', 'mg/dL',
    'measured_at', '2026-09-09T10:00:00Z', 'local_date', '2026-09-09', 'local_time', '10:00:00',
    'tz_name', 'UTC', 'context', 'after_lunch',
    '_proposed_updated_at', (now() + interval '1 hour')::text));
  if st <> 'applied' then raise exception 'FALHA T-SYNC: upsert legítima → %', st; end if;
  if (select user_id from public.glucose_measurements where id='dddddddd-dddd-dddd-dddd-dddddddddddd') <> auth.uid() then
    raise exception 'FALHA T-SYNC: RPC aceitou user_id forjado do payload';
  end if;

  st := public.sync_upsert_row('glucose_measurements', jsonb_build_object(
    'id', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'value', 400, 'unit', 'mg/dL',
    'measured_at', '2026-09-09T10:00:00Z', 'local_date', '2026-09-09', 'local_time', '10:00:00',
    'tz_name', 'UTC', 'context', 'after_lunch',
    '_proposed_updated_at', (now() - interval '1 day')::text));
  if st <> 'skipped-stale' then raise exception 'FALHA T-SYNC: edição stale → %', st; end if;
  select value into val from public.glucose_measurements where id='dddddddd-dddd-dddd-dddd-dddddddddddd';
  if val <> 101 then raise exception 'FALHA T-SYNC: valor sobrescrito por edição stale'; end if;

  st := public.sync_upsert_row('profiles', jsonb_build_object('id', auth.uid()::text));
  if st <> 'table-not-allowed' then raise exception 'FALHA T-SYNC: allowlist burlada (% → %)', 'profiles', st; end if;

  st := public.sync_soft_delete('glucose_measurements', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
  if st <> 'applied' then raise exception 'FALHA T-SYNC: soft_delete → %', st; end if;
  st := public.sync_soft_delete('glucose_measurements', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
  if st <> 'not-found' then raise exception 'FALHA T-SYNC: soft_delete repetido deveria ser no-op (ret=%)', st; end if;
  if (select deleted_at is null from public.glucose_measurements where id='dddddddd-dddd-dddd-dddd-dddddddddddd') then
    raise exception 'FALHA T-SYNC: tombstone não gravado';
  end if;
end $$;
commit;
select 'PASS T-SYNC upsert/LWW/allowlist/soft-delete' as pass;

--@section t-delete-own
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
do $$ begin
  if (select count(*) from public.glucose_measurements where user_id=auth.uid()) = 0 then
    raise exception 'FALHA T-DELETE: pré-condição (A sem medições)';
  end if;
  perform public.delete_own_data();
end $$;
reset role;
do $$ begin
  if exists (select 1 from auth.users where id='11111111-1111-1111-1111-111111111111') then
    raise exception 'FALHA T-DELETE: auth.users não removido';
  end if;
  if exists (select 1 from public.glucose_measurements where user_id='11111111-1111-1111-1111-111111111111') then
    raise exception 'FALHA T-DELETE: dados de A persistiram';
  end if;
  if not exists (select 1 from public.glucose_measurements where user_id='22222222-2222-2222-2222-222222222222') then
    raise exception 'FALHA T-DELETE: exclusão de A afetou B';
  end if;
end $$;
rollback;
select 'PASS T-DELETE-OWN eliminação do titular + cascade + B intacto' as pass;
