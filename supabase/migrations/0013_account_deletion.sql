-- Direito de eliminação (LGPD art. 18, VI): remove TUDO do usuário — auth + dados, via FK cascade.
-- security definer porque delete em auth.users não é permitido à role authenticated.
create or replace function public.delete_own_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

grant execute on function public.delete_own_data() to authenticated;
