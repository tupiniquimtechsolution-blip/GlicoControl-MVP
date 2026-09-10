create table if not exists public.glucose_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  value numeric(6,2) not null check (value > 0),
  unit text not null check (unit in ('mg/dL', 'mmol/L')),
  measured_at timestamptz not null,
  local_date date not null,
  local_time time not null,
  tz_name text not null default 'UTC',
  context text not null check (context in (
    'fasting','before_breakfast','after_breakfast','before_lunch','after_lunch',
    'before_dinner','after_dinner','before_bed','midnight','before_exercise','after_exercise','other')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz
);
create index if not exists idx_gm_user_day on public.glucose_measurements (user_id, local_date desc, local_time desc);
create unique index if not exists uq_gm_minute_context on public.glucose_measurements (user_id, local_date, local_time, context) where deleted_at is null;
create trigger trg_gm_updated before update on public.glucose_measurements
  for each row execute function public.bump_row_version();
