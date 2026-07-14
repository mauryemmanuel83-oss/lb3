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
--
-- IMPORTANTE: el servicio de auth de Supabase (GoTrue, escrito en Go) NO
-- tolera NULL en las columnas de token: al leerlas revienta con un error 500
-- vacío y el login falla. Por eso todas se insertan como cadena vacía ('').
do $$
declare
  new_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'pirqa@escaladores.labeta.app') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current
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
      false,
      '', '', '', '', ''
    );
  end if;
exception when others then
  raise notice 'No se pudo crear PIRQA automáticamente (%). Regístralo desde la app con la contraseña PIRQA26: el trigger de arriba le asigna el rol moderator.', sqlerrm;
end $$;

-- ─── REPARACIÓN ────────────────────────────────────────────
-- Si PIRQA ya se creó con columnas de token en NULL (versión anterior de
-- este archivo), su login devolvía error 500. Esto lo deja usable.
-- Recorre solo las columnas que existan en tu versión de Supabase.
do $$
declare
  col text;
begin
  foreach col in array array[
    'confirmation_token', 'recovery_token', 'email_change',
    'email_change_token_new', 'email_change_token_current',
    'phone_change', 'phone_change_token', 'reauthentication_token'
  ] loop
    begin
      execute format(
        'update auth.users set %I = coalesce(%I, '''') where email = %L',
        col, col, 'pirqa@escaladores.labeta.app'
      );
    exception when undefined_column then null;  -- esa columna no existe: seguimos
    end;
  end loop;
end $$;

-- Nos aseguramos de que la contraseña sea PIRQA26 y el email esté confirmado
update auth.users
set encrypted_password = crypt('PIRQA26', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'pirqa@escaladores.labeta.app';

-- ─── RLS: permisos por ROL ──────────────────────────────────
-- Borramos TANTO los nombres viejos como los nuevos, así este archivo
-- se puede correr las veces que haga falta sin chocar consigo mismo.
drop policy if exists "betas visibles para todos"      on public.betas;
drop policy if exists "betas visibles segun moderacion" on public.betas;
drop policy if exists "publicar beta propia"            on public.betas;
drop policy if exists "editar beta propia"              on public.betas;
drop policy if exists "editar beta propia o moderar"    on public.betas;
drop policy if exists "borrar beta propia"              on public.betas;
drop policy if exists "borrar beta propia o moderar"    on public.betas;

-- Ver: todos ven las visibles; el autor ve las suyas aunque estén
-- ocultas; el moderador lo ve todo.
create policy "betas visibles segun moderacion"
  on public.betas for select
  using (
    (not coalesce(hidden, false) and not coalesce(banned, false))
    or auth.uid() = author_id
    or public.is_moderator()
  );

-- Crear: cada quien la suya (el moderador también crea las oficiales)
create policy "publicar beta propia"
  on public.betas for insert
  with check (auth.uid() = author_id);

-- Editar: el autor la suya; el moderador cualquiera
create policy "editar beta propia o moderar"
  on public.betas for update
  using (auth.uid() = author_id or public.is_moderator());

-- Borrar: el autor la suya; el moderador cualquiera
create policy "borrar beta propia o moderar"
  on public.betas for delete
  using (auth.uid() = author_id or public.is_moderator());
