-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 006 · Fotos en Supabase Storage
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- Es idempotente: puedes correrlo varias veces sin problema.
--
-- Las fotos dejan de guardarse como Base64 dentro de PostgreSQL.
-- A partir de ahora la base solo guarda URLs; los archivos viven en
-- el bucket 'betas' de Storage (servido por CDN).
-- ═══════════════════════════════════════════════════════════

-- ─── Bucket público 'betas' ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('betas', 'betas', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ─── Políticas del bucket ───────────────────────────────────
-- Lectura pública (las fotos se sirven por CDN); escritura solo autenticados.
drop policy if exists "fotos de betas visibles para todos" on storage.objects;
create policy "fotos de betas visibles para todos"
  on storage.objects for select
  using (bucket_id = 'betas');

drop policy if exists "subir foto de beta" on storage.objects;
create policy "subir foto de beta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'betas');

drop policy if exists "borrar foto propia de beta" on storage.objects;
create policy "borrar foto propia de beta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'betas' and (owner = auth.uid() or public.is_moderator()));

-- ─── Referencias en la tabla betas ──────────────────────────
alter table public.betas add column if not exists photo_url text;
alter table public.betas add column if not exists thumbnail_url text;

-- image_data (el Base64 viejo) deja de ser obligatorio para poder
-- insertar betas nuevas sin él. Se elimina del todo en la migración 007,
-- una vez confirmado que no queda ninguna beta pendiente de migrar.
do $$ begin
  alter table public.betas alter column image_data drop not null;
exception when others then null; end $$;

alter table public.betas alter column image_data set default null;

-- Consulta útil: ¿quedan betas con Base64 pendientes de migrar?
--   select count(*) from public.betas where image_data like 'data:%';
