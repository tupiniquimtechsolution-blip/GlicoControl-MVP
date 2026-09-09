create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- dose é texto livre informado pelo paciente; o app NÃO valida, calcula ou interpreta doses
  dose_text text not null check (char_length(dose_text) between 1 and 60),
  instructions text check (instructions is null or char_length(instructions) <= 200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz,
  unique (id, user_id)
);
create index if not exists idx_med_user on public.medications (user_id) where deleted_at is null;
create trigger trg_med_updated before update on public.medications
  for each row execute function public.bump_row_version();

create table if not exists public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null,
  time_of_day time not null,
  days_of_week smallint[] not null check (public.valid_days_of_week(days_of_week)),
  enabled boolean not null default true,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz,
  -- FK composta: impede vincular horário a medicamento de OUTRO usuário
  constraint fk_sched_med_owner foreign key (medication_id, user_id)
    references public.medications (id, user_id) on delete cascade,
  unique (id, user_id)
);
create index if not exists idx_sched_med on public.medication_schedules (medication_id) where deleted_at is null;
create trigger trg_sched_updated before update on public.medication_schedules
  for each row execute function public.bump_row_version();
