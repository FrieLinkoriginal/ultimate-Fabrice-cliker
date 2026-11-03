-- À exécuter une seule fois dans Supabase > SQL Editor.
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (
    char_length(btrim(name)) between 1 and 40
    and lower(btrim(name)) <> 'fabrice'
  ),
  score integer not null check (score between 0 and 1000000),
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;

grant select, insert on public.scores to anon, authenticated;

drop policy if exists "Scores visibles par tous" on public.scores;
create policy "Scores visibles par tous"
  on public.scores for select
  to anon, authenticated
  using (true);

drop policy if exists "Ajouter un score valide" on public.scores;
create policy "Ajouter un score valide"
  on public.scores for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 40
    and lower(btrim(name)) <> 'fabrice'
    and score between 0 and 1000000
  );

notify pgrst, 'reload schema';
