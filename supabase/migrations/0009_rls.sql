-- RLS: todas as tabelas de dados do paciente pertencem a auth.uid(). Sem exceções.
-- (cobertura verificada por teste automatizado: supabase/tests/rls_isolation.sql T-COVERAGE)
alter table public.profiles              enable row level security;
alter table public.glucose_measurements  enable row level security;
alter table public.reminders             enable row level security;
alter table public.medications           enable row level security;
alter table public.medication_schedules  enable row level security;
alter table public.medication_logs       enable row level security;
alter table public.glucose_targets       enable row level security;

-- profiles
create policy profiles_select on public.profiles            for select to authenticated using (id = auth.uid());
create policy profiles_update on public.profiles             for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles             for insert to authenticated with check (id = auth.uid());
-- delete de conta: somente via RPC delete_own_data (evita lockout acidental com dados órfãos)

-- genéricas por tabela de dados
create policy gm_select on public.glucose_measurements for select to authenticated using (user_id = auth.uid());
create policy gm_insert on public.glucose_measurements for insert to authenticated with check (user_id = auth.uid());
create policy gm_update on public.glucose_measurements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy gm_delete on public.glucose_measurements for delete to authenticated using (user_id = auth.uid());

create policy rem_select on public.reminders for select to authenticated using (user_id = auth.uid());
create policy rem_insert on public.reminders for insert to authenticated with check (user_id = auth.uid());
create policy rem_update on public.reminders for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rem_delete on public.reminders for delete to authenticated using (user_id = auth.uid());

create policy med_select on public.medications for select to authenticated using (user_id = auth.uid());
create policy med_insert on public.medications for insert to authenticated with check (user_id = auth.uid());
create policy med_update on public.medications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy med_delete on public.medications for delete to authenticated using (user_id = auth.uid());

create policy sch_select on public.medication_schedules for select to authenticated using (user_id = auth.uid());
create policy sch_insert on public.medication_schedules for insert to authenticated with check (user_id = auth.uid());
create policy sch_update on public.medication_schedules for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sch_delete on public.medication_schedules for delete to authenticated using (user_id = auth.uid());

create policy log_select on public.medication_logs for select to authenticated using (user_id = auth.uid());
create policy log_insert on public.medication_logs for insert to authenticated with check (user_id = auth.uid());
create policy log_update on public.medication_logs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy log_delete on public.medication_logs for delete to authenticated using (user_id = auth.uid());

create policy tgt_select on public.glucose_targets for select to authenticated using (user_id = auth.uid());
create policy tgt_insert on public.glucose_targets for insert to authenticated with check (user_id = auth.uid());
create policy tgt_update on public.glucose_targets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tgt_delete on public.glucose_targets for delete to authenticated using (user_id = auth.uid());
