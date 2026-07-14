-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 007 · Eliminar el Base64 definitivamente
--
-- ⚠️  CORRE ESTO SOLO DESPUÉS de haber migrado las fotos existentes.
--
-- 1) Corre primero la migración 006.
-- 2) En la app, entra como moderador (PIRQA) → panel Moderación →
--    botón "Migrar fotos antiguas" (solo aparece si hay pendientes).
-- 3) Comprueba que este contador da 0:
--
--      select count(*) from public.betas where image_data like 'data:%';
--
-- 4) Recién entonces corre este archivo.
-- ═══════════════════════════════════════════════════════════

do $$
declare
  pendientes int;
begin
  select count(*) into pendientes from public.betas where image_data like 'data:%';

  if pendientes > 0 then
    raise exception
      'Quedan % betas con foto en Base64 sin migrar. Migra primero desde el panel de Moderación; si no, perderías esas fotos.',
      pendientes;
  end if;

  alter table public.betas drop column if exists image_data;
  raise notice 'Listo: la columna image_data ya no existe. PostgreSQL solo guarda URLs.';
end $$;
