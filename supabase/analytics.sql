-- À exécuter une fois dans Supabase > SQL Editor.
-- Cette table ne stocke ni adresse IP, ni nom, ni donnée de compte.
create table if not exists public.site_visits (
  visit_id uuid primary key,
  visitor_id uuid not null,
  device_type text not null check (device_type in ('desktop', 'mobile')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0)
);

alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;

create or replace function public.record_site_visit(
  p_visit_id uuid,
  p_visitor_id uuid,
  p_device_type text,
  p_duration_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_visit_id is null or p_visitor_id is null then
    raise exception 'Identifiant de visite invalide.';
  end if;
  if p_device_type not in ('desktop', 'mobile') then
    raise exception 'Type d appareil invalide.';
  end if;
  if p_duration_seconds is null or p_duration_seconds < 0 or p_duration_seconds > 60 then
    raise exception 'Durée de visite invalide.';
  end if;

  insert into public.site_visits (visit_id, visitor_id, device_type, duration_seconds)
  values (p_visit_id, p_visitor_id, p_device_type, p_duration_seconds)
  on conflict (visit_id) do update
  set last_seen_at = now(),
      duration_seconds = public.site_visits.duration_seconds + excluded.duration_seconds
  where public.site_visits.visitor_id = excluded.visitor_id;
end;
$$;

revoke all on function public.record_site_visit(uuid, uuid, text, integer) from public;
grant execute on function public.record_site_visit(uuid, uuid, text, integer) to anon, authenticated;

notify pgrst, 'reload schema';
