-- Follow-up hardening from Supabase managed-project advisors.
-- Keeps migration history append-only.

-- Fix mutable search_path warnings on helper functions.
alter function public.set_updated_at() set search_path = public;
alter function public.bump_row_version() set search_path = public;
alter function public.valid_days_of_week(smallint[]) set search_path = public;

-- Let auth.uid() be evaluated once per statement instead of once per row.
alter policy profiles_select on public.profiles using (id = (select auth.uid()));
alter policy profiles_update on public.profiles using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy profiles_insert on public.profiles with check (id = (select auth.uid()));

alter policy gm_select on public.glucose_measurements using (user_id = (select auth.uid()));
alter policy gm_insert on public.glucose_measurements with check (user_id = (select auth.uid()));
alter policy gm_update on public.glucose_measurements using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy gm_delete on public.glucose_measurements using (user_id = (select auth.uid()));

alter policy rem_select on public.reminders using (user_id = (select auth.uid()));
alter policy rem_insert on public.reminders with check (user_id = (select auth.uid()));
alter policy rem_update on public.reminders using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy rem_delete on public.reminders using (user_id = (select auth.uid()));

alter policy med_select on public.medications using (user_id = (select auth.uid()));
alter policy med_insert on public.medications with check (user_id = (select auth.uid()));
alter policy med_update on public.medications using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy med_delete on public.medications using (user_id = (select auth.uid()));

alter policy sch_select on public.medication_schedules using (user_id = (select auth.uid()));
alter policy sch_insert on public.medication_schedules with check (user_id = (select auth.uid()));
alter policy sch_update on public.medication_schedules using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy sch_delete on public.medication_schedules using (user_id = (select auth.uid()));

alter policy log_select on public.medication_logs using (user_id = (select auth.uid()));
alter policy log_insert on public.medication_logs with check (user_id = (select auth.uid()));
alter policy log_update on public.medication_logs using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy log_delete on public.medication_logs using (user_id = (select auth.uid()));

alter policy tgt_select on public.glucose_targets using (user_id = (select auth.uid()));
alter policy tgt_insert on public.glucose_targets with check (user_id = (select auth.uid()));
alter policy tgt_update on public.glucose_targets using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy tgt_delete on public.glucose_targets using (user_id = (select auth.uid()));

-- Cover foreign keys reported by the managed-project performance advisor.
create index if not exists idx_sched_user on public.medication_schedules (user_id);
create index if not exists idx_sched_med_owner on public.medication_schedules (medication_id, user_id);
create index if not exists idx_log_med_owner on public.medication_logs (medication_id, user_id);
create index if not exists idx_log_sched_owner on public.medication_logs (schedule_id, user_id) where schedule_id is not null;
