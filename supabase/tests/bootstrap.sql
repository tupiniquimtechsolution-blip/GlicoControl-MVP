-- Ambiente Supabase-like mínimo para testes locais/CI (roles, auth.users, auth.uid()).
-- NÃO é código de aplicação; nunca versionar como artefato shipped.
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant usage on schema auth to anon, authenticated, service_role;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    (nullif(current_setting('request.jwt.claims', true), ''))::jsonb ->> 'sub',
    ''
  )::uuid
$$;
grant execute on function auth.uid() to public;
