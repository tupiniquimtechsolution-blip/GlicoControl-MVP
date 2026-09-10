create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.bump_row_version()
returns trigger language plpgsql as $$
begin
  new.row_version := old.row_version + 1;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.valid_days_of_week(days smallint[])
returns boolean language sql immutable as $$
  select days is not null and cardinality(days) between 1 and 7
    and days = (select array_agg(distinct d order by d) from unnest(days) d)
    and not exists (select 1 from unnest(days) d where d < 0 or d > 6);
$$;
