-- À exécuter une fois dans Supabase > SQL Editor.
create table if not exists public.achievement_players (
  player_id uuid primary key,
  username text not null check (char_length(btrim(username)) between 1 and 24),
  achievements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists achievement_players_username_lower_idx
  on public.achievement_players (lower(username));

alter table public.achievement_players enable row level security;
revoke all on public.achievement_players from anon, authenticated;

create or replace function public.register_achievement_player(
  p_player_id uuid,
  p_username text
)
returns table(player_id uuid, username text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_username text;
begin
  clean_username := regexp_replace(btrim(coalesce(p_username, '')), '\s+', ' ', 'g');
  if p_player_id is null or char_length(clean_username) not between 1 and 24 then
    raise exception 'Le pseudo doit contenir entre 1 et 24 caractères.';
  end if;

  insert into public.achievement_players (player_id, username)
  values (p_player_id, clean_username)
  on conflict on constraint achievement_players_pkey do nothing;

  return query
    select p.player_id, p.username
    from public.achievement_players p
    where p.player_id = p_player_id;
end;
$$;

create or replace function public.save_achievement_progress(
  p_player_id uuid,
  p_achievement_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowed_ids text[] := array[
    's10', 's20', 's30', 's40', 's50', 's60', 's70', 's80', 's90', 's100',
    'd67', 'd69', 'r2', 'r3', 'allskins', 'death1', 'death10', 'death100',
    'death1000', 'hour', 'one', 'zero', 'close', 'reffu', 'hand', 'menteur',
    'shop', 'alan', 'allshop', 'trueEnding', 'noHit', 'mute', 'lavage', 'coll'
  ];
  unknown_id text;
begin
  if p_player_id is null or p_achievement_ids is null or cardinality(p_achievement_ids) > 100
    or array_position(p_achievement_ids, null) is not null then
    raise exception 'Progression des succès invalide.';
  end if;

  select id into unknown_id
  from unnest(p_achievement_ids) as supplied(id)
  where id <> all (allowed_ids)
  limit 1;
  if unknown_id is not null then
    raise exception 'Identifiant de succès invalide.';
  end if;

  update public.achievement_players p
  set achievements = (
        select coalesce(array_agg(distinct id order by id), '{}'::text[])
        from unnest(p.achievements || p_achievement_ids) as earned(id)
      ),
      updated_at = now()
  where p.player_id = p_player_id;

  if not found then
    raise exception 'Profil joueur introuvable.';
  end if;
end;
$$;

create or replace function public.list_achievement_players()
returns table(username text, achievements text[])
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.username, p.achievements
  from public.achievement_players p
  order by cardinality(p.achievements) desc, p.updated_at desc, p.username asc
  limit 100;
$$;

revoke all on function public.register_achievement_player(uuid, text) from public;
revoke all on function public.save_achievement_progress(uuid, text[]) from public;
revoke all on function public.list_achievement_players() from public;
grant execute on function public.register_achievement_player(uuid, text) to anon, authenticated;
grant execute on function public.save_achievement_progress(uuid, text[]) to anon, authenticated;
grant execute on function public.list_achievement_players() to anon, authenticated;

notify pgrst, 'reload schema';
