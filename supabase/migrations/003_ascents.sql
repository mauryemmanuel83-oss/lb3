-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 003 · Registro de ascensos por usuario
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- Es idempotente: puedes correrlo varias veces sin problema.
-- ═══════════════════════════════════════════════════════════

-- Historial de ascensos: cada fila es un intento/envío de UN usuario
-- sobre UNA beta. Un usuario puede tener varias filas por beta.
create table if not exists public.ascents (
  id uuid primary key default gen_random_uuid(),
  beta_id uuid not null references public.betas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  discipline text not null check (discipline in ('boulder', 'deportiva')),
  -- Solo aplica en deportiva; en boulder queda null
  ascent_type text check (ascent_type in ('top_rope', 'lead')),
  -- boulder: flash | onsight | al_ojo | completed | project
  -- deportiva: flash | onsight | redpoint | attempt | project
  result text not null check (result in
    ('flash', 'onsight', 'al_ojo', 'completed', 'project', 'redpoint', 'attempt')),
  grade text not null default '',   -- snapshot del grado al momento del ascenso
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.ascents enable row level security;

do $$ begin
  create policy "ascensos visibles para todos" on public.ascents for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "registrar ascenso propio" on public.ascents for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "editar ascenso propio" on public.ascents for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "borrar ascenso propio" on public.ascents for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists ascents_user_idx on public.ascents (user_id);
create index if not exists ascents_beta_idx on public.ascents (beta_id);
