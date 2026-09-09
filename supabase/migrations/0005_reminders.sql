create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  time_of_day time not null,
  days_of_week smallint[] not null check (public.valid_days_of_week(days_of_week)),
  repeat text not null default 'weekly' check (repeat in ('once','daily','weekly')),
  snooze_minutes integer not null default 10 check (snooze_minutes between 0 and 240),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz
);
create index if not exists idx_rem_user on public.reminders (user_id) where deleted_at is null;
create trigger trg_rem_updated before update on public.reminders
  for each row execute function public.bump_row_version();
