create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null,
  schedule_id uuid,
  action text not null check (action in ('taken','snoozed','skipped')),
  logged_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_version bigint not null default 1,
  deleted_at timestamptz,
  constraint fk_log_med_owner foreign key (medication_id, user_id)
    references public.medications (id, user_id) on delete cascade,
  constraint fk_log_sched_owner foreign key (schedule_id, user_id)
    references public.medication_schedules (id, user_id) on delete cascade
);
create index if not exists idx_log_user_time on public.medication_logs (user_id, logged_at desc);
create trigger trg_log_updated before update on public.medication_logs
  for each row execute function public.bump_row_version();
