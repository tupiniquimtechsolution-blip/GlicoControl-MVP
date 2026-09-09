create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  unit text not null default 'mg/dL' check (unit in ('mg/dL', 'mmol/L')),
  locale text not null default 'pt-BR',
  timezone text,
  theme text not null default 'system' check (theme in ('pastelCalm','greenWhite','yellowWhite','blackWhite','blackYellow','system')),
  onboarding_completed boolean not null default false,
  consent_at timestamptz,
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
