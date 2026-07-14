-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 005 · Puntuación, estadísticas y ranking
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- Es idempotente: puedes correrlo varias veces sin problema.
--
-- TODA la lógica de puntos vive AQUÍ (una sola fuente de verdad).
-- Para cambiar la puntuación en el futuro solo se toca este archivo.
-- ═══════════════════════════════════════════════════════════

-- ─── Escalas de grado (orden = dificultad) ──────────────────
create or replace function public.grade_index(p_discipline text, p_grade text)
returns int language sql immutable as $$
  select coalesce(
    array_position(
      case when p_discipline = 'boulder'
        then array['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9']
        else array['5a','5b','5c','6a','6a+','6b','6b+','6c','6c+',
                   '7a','7a+','7b','7b+','7c','7c+','8a']
      end,
      p_grade
    ) - 1,
    -1
  );
$$;

-- ─── ¿El resultado cuenta como encadene? ────────────────────
-- Proyecto e intento NO suman puntos ni cuentan como completada.
create or replace function public.is_send_result(p_result text)
returns boolean language sql immutable as $$
  select p_result in ('flash', 'onsight', 'al_ojo', 'completed', 'redpoint');
$$;

-- ─── FÓRMULA DE PUNTUACIÓN (el único lugar donde se define) ──
--   puntos = base_del_grado × multiplicador_resultado × multiplicador_tipo
--
--   base_del_grado : crece con la dificultad (100 × 1.25^índice)
--   resultado      : onsight 1.5 · flash 1.3 · al ojo 1.15 · redpoint/completada 1.0
--   tipo (deportiva): lead ×1.2 (bonificación) · top rope ×0.8 (menor)
--   proyecto/intento: 0 puntos
create or replace function public.calculate_ascent_points(
  p_discipline text, p_result text, p_ascent_type text, p_grade text
) returns int language plpgsql immutable as $$
declare
  idx int;
  base numeric;
  result_mult numeric;
  type_mult numeric;
begin
  if not public.is_send_result(p_result) then
    return 0;
  end if;

  idx := public.grade_index(p_discipline, p_grade);
  if idx < 0 then
    return 0;
  end if;

  base := 100 * power(1.25, idx);

  result_mult := case p_result
    when 'onsight'   then 1.5
    when 'flash'     then 1.3
    when 'al_ojo'    then 1.15
    when 'redpoint'  then 1.0
    when 'completed' then 1.0
    else 0
  end;

  type_mult := case
    when p_discipline = 'deportiva' and p_ascent_type = 'lead'     then 1.2
    when p_discipline = 'deportiva' and p_ascent_type = 'top_rope' then 0.8
    else 1.0
  end;

  return round(base * result_mult * type_mult);
end;
$$;

-- ─── Columnas derivadas en ascents (calculadas por trigger) ──
alter table public.ascents add column if not exists points int not null default 0;
alter table public.ascents add column if not exists grade_index int not null default -1;
alter table public.ascents add column if not exists is_send boolean not null default false;

create or replace function public.on_ascent_score()
returns trigger language plpgsql as $$
begin
  new.is_send     := public.is_send_result(new.result);
  new.grade_index := public.grade_index(new.discipline, new.grade);
  new.points      := public.calculate_ascent_points(new.discipline, new.result, new.ascent_type, new.grade);
  return new;
end;
$$;

drop trigger if exists ascent_scoring on public.ascents;
create trigger ascent_scoring
  before insert or update on public.ascents
  for each row execute function public.on_ascent_score();

-- Recalcula los ascensos ya existentes
update public.ascents set
  is_send     = public.is_send_result(result),
  grade_index = public.grade_index(discipline, grade),
  points      = public.calculate_ascent_points(discipline, result, ascent_type, grade);

create index if not exists ascents_points_idx on public.ascents (user_id, is_send);

-- ─── VISTA: estadísticas por usuario (fuente única) ─────────
-- Beta Score = suma del MEJOR ascenso de cada beta (nunca se cuenta
-- dos veces la misma beta). Proyectos e intentos no suman.
create or replace view public.user_stats as
with best_per_beta as (
  select user_id, beta_id, max(points) as pts
  from public.ascents
  where is_send
  group by user_id, beta_id
)
select
  p.id   as user_id,
  p.username,
  p.role,
  coalesce((select sum(b.pts) from best_per_beta b where b.user_id = p.id), 0)::int as beta_score,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.is_send), 0)::int as betas_completed,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.result = 'flash'), 0)::int as flash_count,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.result = 'onsight'), 0)::int as onsight_count,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.result = 'redpoint'), 0)::int as redpoint_count,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.is_send and a.ascent_type = 'lead'), 0)::int as lead_count,
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and a.is_send and a.ascent_type = 'top_rope'), 0)::int as top_rope_count,
  coalesce((select max(a.grade_index) from public.ascents a
            where a.user_id = p.id and a.is_send and a.discipline = 'boulder'), -1)::int as max_boulder_index,
  coalesce((select max(a.grade_index) from public.ascents a
            where a.user_id = p.id and a.is_send and a.discipline = 'deportiva'), -1)::int as max_sport_index,
  -- proyectos activos: betas con intento/proyecto y SIN ningún encadene
  coalesce((select count(distinct a.beta_id) from public.ascents a
            where a.user_id = p.id and not a.is_send
              and not exists (
                select 1 from public.ascents s
                where s.user_id = p.id and s.beta_id = a.beta_id and s.is_send
              )), 0)::int as active_projects,
  (select max(a.created_at) from public.ascents a where a.user_id = p.id) as last_ascent_at,
  coalesce((select count(*) from public.betas bt
            where bt.author_id = p.id and not coalesce(bt.banned, false)), 0)::int as betas_published
from public.profiles p;

-- ─── VISTA: ranking global (sin moderadores) ────────────────
-- Desempate: más betas completadas → mayor grado → registro más antiguo.
create or replace view public.ranking as
select
  user_id, username, beta_score, betas_completed, flash_count, onsight_count,
  redpoint_count, lead_count, top_rope_count, max_boulder_index, max_sport_index,
  active_projects, betas_published, last_ascent_at,
  row_number() over (
    order by beta_score desc,
             betas_completed desc,
             greatest(max_boulder_index, max_sport_index) desc,
             last_ascent_at asc nulls last,
             username asc
  )::int as position
from public.user_stats
where role = 'user';   -- moderadores y admins NUNCA compiten

grant select on public.user_stats to anon, authenticated;
grant select on public.ranking to anon, authenticated;
