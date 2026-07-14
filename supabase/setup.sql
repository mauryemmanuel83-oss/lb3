-- ═══════════════════════════════════════════════════════════
-- LA BETA · Esquema completo para Supabase
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- ─── Perfiles de escaladores ────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "perfiles visibles para todos"
  on public.profiles for select using (true);

-- Crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Betas ──────────────────────────────────────────────────
create table if not exists public.betas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  grade text not null,
  wall_id text not null,
  hold_color text not null default '#ef4444',
  styles text[] not null default '{}',
  notes text not null default '',
  image_data text not null,
  markers jsonb not null default '[]',
  strokes jsonb not null default '[]',
  texts jsonb not null default '[]',
  active_project boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.betas enable row level security;

create policy "betas visibles para todos"
  on public.betas for select using (true);

create policy "publicar beta propia"
  on public.betas for insert with check (auth.uid() = author_id);

create policy "editar beta propia"
  on public.betas for update using (auth.uid() = author_id);

create policy "borrar beta propia"
  on public.betas for delete using (auth.uid() = author_id);

create index if not exists betas_created_at_idx on public.betas (created_at desc);
create index if not exists betas_author_idx on public.betas (author_id);

-- ─── Comentarios ────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  beta_id uuid not null references public.betas(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comentarios visibles para todos"
  on public.comments for select using (true);

create policy "comentar como uno mismo"
  on public.comments for insert with check (auth.uid() = author_id);

create policy "borrar comentario propio"
  on public.comments for delete using (auth.uid() = author_id);

create index if not exists comments_beta_idx on public.comments (beta_id);

-- ─── Recomendaciones (1 por usuario por beta) ───────────────
create table if not exists public.recommendations (
  beta_id uuid not null references public.betas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (beta_id, user_id)
);

alter table public.recommendations enable row level security;

create policy "recomendaciones visibles para todos"
  on public.recommendations for select using (true);

create policy "recomendar como uno mismo"
  on public.recommendations for insert with check (auth.uid() = user_id);

create policy "quitar recomendación propia"
  on public.recommendations for delete using (auth.uid() = user_id);
