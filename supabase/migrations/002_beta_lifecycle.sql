-- ═══════════════════════════════════════════════════════════
-- LA BETA · Migración 002 · Ciclo de vida y versionado de betas
-- Pega TODO este archivo en: Dashboard → SQL Editor → Run
-- Es idempotente: puedes correrlo varias veces sin problema.
-- ═══════════════════════════════════════════════════════════

-- ─── Nuevas columnas en betas ───────────────────────────────
alter table public.betas add column if not exists status text not null default 'active';
alter table public.betas add column if not exists version int not null default 1;
alter table public.betas add column if not exists updated_at timestamptz not null default now();
alter table public.betas add column if not exists replaced_by uuid references public.betas(id) on delete set null;
alter table public.betas add column if not exists replaces uuid references public.betas(id) on delete set null;

-- Estados válidos: active | holds_changed | removed
do $$ begin
  alter table public.betas add constraint betas_status_check
    check (status in ('active', 'holds_changed', 'removed'));
exception when duplicate_object then null; end $$;

-- ─── Reportes de cambio (1 por usuario por beta) ────────────
create table if not exists public.beta_reports (
  beta_id uuid not null references public.betas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('holds_changed', 'removed')),
  created_at timestamptz not null default now(),
  primary key (beta_id, user_id)
);

alter table public.beta_reports enable row level security;

do $$ begin
  create policy "reportes visibles para todos" on public.beta_reports for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "reportar como uno mismo" on public.beta_reports for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "actualizar reporte propio" on public.beta_reports for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "borrar reporte propio" on public.beta_reports for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists beta_reports_beta_idx on public.beta_reports (beta_id);

-- ─── Consenso comunitario ───────────────────────────────────
-- Una beta cambia de estado sola cuando REPORT_THRESHOLD usuarios
-- distintos reportan lo mismo. El conteo es a nivel de fila (1 por
-- usuario por la PK), así nadie puede inflarlo. security definer
-- permite al trigger actualizar betas de otros autores sin abrir RLS.
create or replace function public.apply_beta_consensus(target_beta uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  threshold constant int := 3;   -- ← ajusta aquí el umbral de consenso
  holds_count int;
  removed_count int;
  new_status text;
begin
  select count(*) into holds_count   from beta_reports where beta_id = target_beta and reason = 'holds_changed';
  select count(*) into removed_count from beta_reports where beta_id = target_beta and reason = 'removed';

  new_status := null;
  if removed_count >= threshold then
    new_status := 'removed';          -- "removida" pesa más que "presas cambiadas"
  elsif holds_count >= threshold then
    new_status := 'holds_changed';
  end if;

  if new_status is not null then
    update betas
      set status = new_status, updated_at = now()
      where id = target_beta
        and status <> new_status
        and not (status = 'removed' and new_status = 'holds_changed'); -- nunca degradar
  end if;
end; $$;

create or replace function public.on_beta_report_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.apply_beta_consensus(coalesce(new.beta_id, old.beta_id));
  return null;
end; $$;

drop trigger if exists beta_report_consensus on public.beta_reports;
create trigger beta_report_consensus
  after insert or update or delete on public.beta_reports
  for each row execute function public.on_beta_report_change();

-- ─── Versionado (V1 → V2 → …) ───────────────────────────────
-- Al publicar una beta con `replaces`, su versión = versión_anterior + 1.
create or replace function public.on_beta_version_before()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_version int;
begin
  if new.replaces is not null then
    select version into parent_version from betas where id = new.replaces;
    if parent_version is not null then
      new.version := parent_version + 1;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists beta_version_before on public.betas;
create trigger beta_version_before
  before insert on public.betas
  for each row execute function public.on_beta_version_before();

-- Enlaza la beta anterior con la nueva (histórico).
create or replace function public.on_beta_version_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.replaces is not null then
    update betas set replaced_by = new.id, updated_at = now() where id = new.replaces;
  end if;
  return null;
end; $$;

drop trigger if exists beta_version_after on public.betas;
create trigger beta_version_after
  after insert on public.betas
  for each row execute function public.on_beta_version_after();
