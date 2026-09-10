revoke all on schema public from anon;
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.glucose_measurements, public.reminders,
  public.medications, public.medication_schedules, public.medication_logs,
  public.glucose_targets to authenticated;
