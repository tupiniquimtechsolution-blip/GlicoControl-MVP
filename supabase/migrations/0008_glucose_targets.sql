create table if not exists public.glucose_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  context text not null default 'any' check (context in (
    'any','fasting','before_breakfast','after_breakfast','before_lunch','after_lunch',
    'before_dinner','after_dinner','before_bed','midnight','before_exercise','after_exercise','other')),
  unit text not null check (unit in ('mg/dL', 'mmol/L')),
  min_value numeric(6,2) check (min_value is null or min_value > 0),
  max_value numeric(6,2) check (max_value is null or max_value > 0),
  check (min_value is null or max_value is null or min_value < max_value),
  notes text check (notes is null or char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz
);
create unique index if not exists uq_target_user_ctx on public.glucose_targets (user_id, context, unit) where deleted_at is null;
create trigger trg_tgt_updated before update on public.glucose_targets
  for each row execute function public.bump_row_version();
