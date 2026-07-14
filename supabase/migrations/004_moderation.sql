-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 004 · Roles y moderación
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- Es idempotente: puedes correrlo varias veces sin problema.
-- ═══════════════════════════════════════════════════════════

-- ─── Rol en el perfil ───────────────────────────────────────
alter table public.profiles add column if not exists role text not null default 'user';

do $$ begin
  alter table public.profiles add constraint profiles_role_check
    check (role in ('user', 'moderator', 'admin'));
exception when duplicate_object then null; end $$;

-- ─── Campos de moderación en betas ──────────────────────────
-- Nunca borramos físicamente: ocultamos o baneamos para conservar historial.
alter table public.betas add column if not exists official boolean not null default false;
alter table public.betas add column if not exists hidden boolean not null default false;
alter table public.betas add column if not exists banned boolean not null default false;
alter table public.betas add column if not exists moderated_by uuid references public.profiles(id) on delete set null;
alter table public.betas add column if not exists moderated_at timestamptz;

create index if not exists betas_official_idx on public.betas (official) where official;
create index if not exists betas_moderation_idx on public.betas (hidden, banned);

-- ─── Helper de permisos: SIEMPRE por rol, nunca por username ─
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

-- ─── PIRQA = moderador ──────────────────────────────────────
-- El rol se asigna en el trigger de alta, así el usuario PIRQA nace
-- moderador aunque se registre desde la app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname text;
  urole text := 'user';
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  -- El gimnasio (PIRQA) entra como moderador desde el minuto cero
  if lower(uname) = 'pirqa' then
    urole := 'moderator';
  end if;
  insert into public.profiles (id, username, role) values (new.id, uname, urole);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si PIRQA ya existía como usuario normal, lo promovemos.
update public.profiles set role = 'moderator' where lower(username) = 'pirqa' and role = 'user';

-- Alta automática del usuario PIRQA / PIRQA26 si todavía no existe.
-- (Si tu instancia rechaza el insert directo en auth.users, simplemente
--  registra PIRQA con la contraseña PIRQA26 desde la app: el trigger de
--  arriba le asigna el rol moderator automáticamente.)
do $$
declare
  new_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'pirqa@escaladores.labeta.app') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      'pirqa@escaladores.labeta.app',
      crypt('PIRQA26', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"PIRQA"}'::jsonb,
      false
    );
  end if;
exception when others then
  raise notice 'No se pudo crear PIRQA automáticamente (%). Regístralo desde la app con la contraseña PIRQA26: el trigger lo hará moderador.', sqlerrm;
end $$;

-- ─── RLS: permisos por ROL ──────────────────────────────────
-- Betas: todos ven las visibles; el autor ve las suyas aunque estén
-- ocultas; el moderador lo ve todo.
drop policy if exists "betas visibles para todos" on public.betas;
create policy "betas visibles segun moderacion"
  on public.betas for select
  using (
    (not coalesce(hidden, false) and not coalesce(banned, false))
    or auth.uid() = author_id
    or public.is_moderator()
  );

-- Crear: cada quien la suya (el moderador también crea las oficiales)
drop policy if exists "publicar beta propia" on public.betas;
create policy "publicar beta propia"
  on public.betas for insert
  with check (auth.uid() = author_id);

-- Editar: el autor la suya; el moderador cualquiera
drop policy if exists "editar beta propia" on public.betas;
create policy "editar beta propia o moderar"
  on public.betas for update
  using (auth.uid() = author_id or public.is_moderator());

-- Borrar: el autor la suya; el moderador cualquiera
drop policy if exists "borrar beta propia" on public.betas;
create policy "borrar beta propia o moderar"
  on public.betas for delete
  using (auth.uid() = author_id or public.is_moderator());
