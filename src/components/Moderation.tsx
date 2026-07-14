import React, { useState, useMemo, useEffect } from 'react';
import { Beta, Wall } from '../types';
import { Mascot } from './Mascot';
import { countLegacyBase64Betas, migrateLegacyImages } from '../api';

type ModFilter = 'all' | 'reported' | 'official' | 'hidden' | 'banned';

interface ModerationProps {
  betas: Beta[];
  walls: Wall[];
  onSelectBeta: (betaId: string) => void;
  onModerate: (betaId: string, flag: 'official' | 'hidden' | 'banned', value: boolean) => void;
  onDeleteBeta: (betaId: string) => void;
  onNavigateToBuild: () => void;
}

const FILTERS: { key: ModFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'Todas', icon: 'apps' },
  { key: 'reported', label: 'Reportadas', icon: 'flag' },
  { key: 'official', label: 'Oficiales', icon: 'verified' },
  { key: 'hidden', label: 'Ocultas', icon: 'visibility_off' },
  { key: 'banned', label: 'Baneadas', icon: 'block' }
];

/**
 * Panel exclusivo del moderador (rol moderator/admin).
 * Nunca borra por defecto: oculta, banea o restaura para conservar historial.
 */
export const Moderation: React.FC<ModerationProps> = ({
  betas,
  walls,
  onSelectBeta,
  onModerate,
  onDeleteBeta,
  onNavigateToBuild
}) => {
  const [filter, setFilter] = useState<ModFilter>('all');
  const [wallFilter, setWallFilter] = useState<string>('all');

  // Migración de fotos antiguas (Base64 en PostgreSQL → Storage)
  const [legacyCount, setLegacyCount] = useState(0);
  const [migrating, setMigrating] = useState<null | { done: number; total: number }>(null);

  useEffect(() => {
    countLegacyBase64Betas().then(setLegacyCount);
  }, [betas.length]);

  const runMigration = async () => {
    if (migrating) return;
    if (!confirm(`Se subirán ${legacyCount} fotos a Supabase Storage. ¿Continuar?`)) return;
    setMigrating({ done: 0, total: legacyCount });
    try {
      const res = await migrateLegacyImages((done, total) => setMigrating({ done, total }));
      alert(
        res.fallidas === 0
          ? `Listo: ${res.migradas} fotos migradas a Storage.`
          : `Migradas ${res.migradas}, fallaron ${res.fallidas}.\n\n${res.errores.slice(0, 3).join('\n')}`
      );
      setLegacyCount(await countLegacyBase64Betas());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'La migración falló.');
    } finally {
      setMigrating(null);
    }
  };

  const filtered = useMemo(() => {
    let list = betas;
    if (wallFilter !== 'all') list = list.filter((b) => b.wallId === wallFilter);

    switch (filter) {
      case 'reported':
        return list.filter((b) => b.reportsHolds + b.reportsRemoved > 0);
      case 'official':
        return list.filter((b) => b.official);
      case 'hidden':
        return list.filter((b) => b.hidden);
      case 'banned':
        return list.filter((b) => b.banned);
      default:
        return list;
    }
  }, [betas, filter, wallFilter]);

  const counts = useMemo(
    () => ({
      all: betas.length,
      reported: betas.filter((b) => b.reportsHolds + b.reportsRemoved > 0).length,
      official: betas.filter((b) => b.official).length,
      hidden: betas.filter((b) => b.hidden).length,
      banned: betas.filter((b) => b.banned).length
    }),
    [betas]
  );

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-end card-in">
        <div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-primary-container tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px]">shield_person</span>
            Moderación
          </h2>
          <p className="font-mono text-[10px] text-on-surface-variant mt-1.5 uppercase tracking-wider">
            Gestión de rutas oficiales del gimnasio
          </p>
        </div>
        <button
          onClick={onNavigateToBuild}
          className="h-11 px-4 bg-primary-container text-on-primary font-display font-bold text-xs uppercase rounded-lg flex items-center gap-1.5 btn-punch shadow-[3px_3px_0_0_rgba(0,0,0,1)] shrink-0"
          id="btn-mod-create-official"
        >
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
          Ruta oficial
        </button>
      </div>

      {/* Migración de fotos antiguas: solo si quedan pendientes */}
      {legacyCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/50 rounded-xl p-4 flex flex-col gap-3 card-in">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-300 text-[20px] mt-0.5">cloud_upload</span>
            <p className="font-sans text-xs text-amber-100 leading-relaxed">
              Hay <strong>{legacyCount}</strong> {legacyCount === 1 ? 'beta' : 'betas'} con la foto guardada dentro de
              la base de datos (formato antiguo). Migrarlas a Storage libera espacio y acelera la app.
            </p>
          </div>
          {migrating ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${migrating.total ? (migrating.done / migrating.total) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="font-mono text-[10px] text-amber-200 whitespace-nowrap">
                {migrating.done} / {migrating.total}
              </span>
            </div>
          ) : (
            <button
              onClick={runMigration}
              className="h-11 bg-amber-600 text-white font-display font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 btn-punch shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
              id="btn-migrate-photos"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Migrar fotos antiguas
            </button>
          )}
        </div>
      )}

      {/* Filtros por estado */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 h-9 px-3 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all border ${
              filter === f.key
                ? 'bg-primary-container text-on-primary border-primary-container font-bold'
                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-white'
            }`}
            id={`btn-mod-filter-${f.key}`}
          >
            <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
            {f.label}
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-black/15' : 'bg-surface-container-high'
              }`}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Filtro por muro (gimnasio) */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Muro</label>
        <select
          value={wallFilter}
          onChange={(e) => setWallFilter(e.target.value)}
          className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 text-sm text-on-surface focus:border-primary-container focus:outline-none cursor-pointer"
          id="select-mod-wall"
        >
          <option value="all">Todos los muros</option>
          {walls.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3" id="moderation-list">
        {filtered.length === 0 ? (
          <div className="bg-[#18181B] border border-[#3F3F46] p-8 text-center rounded-xl flex flex-col items-center gap-3">
            <Mascot state="empty" size={80} />
            <p className="text-sm text-on-surface-variant">No hay betas en este filtro.</p>
          </div>
        ) : (
          filtered.map((beta, i) => {
            const wall = walls.find((w) => w.id === beta.wallId);
            const reports = beta.reportsHolds + beta.reportsRemoved;
            return (
              <div
                key={beta.id}
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
                className={`card-in bg-[#18181B] border rounded-xl overflow-hidden ${
                  beta.banned
                    ? 'border-red-800/60'
                    : beta.hidden
                      ? 'border-outline-variant opacity-70'
                      : beta.official
                        ? 'border-primary-container/60'
                        : 'border-[#3F3F46]'
                }`}
                id={`mod-beta-${beta.id}`}
              >
                {/* Info */}
                <div
                  onClick={() => onSelectBeta(beta.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-container/40 transition-colors"
                >
                  <img
                    src={beta.thumbnailUrl}
                    alt={beta.name}
                    loading="lazy"
                    decoding="async"
                    className={`w-14 h-14 rounded-lg object-cover border border-outline-variant shrink-0 ${
                      beta.banned || beta.hidden ? 'grayscale' : ''
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-display font-bold text-sm text-white truncate">{beta.name}</h4>
                      <span className="font-mono text-[9px] text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">
                        {beta.grade}
                      </span>
                      {beta.official && (
                        <span className="font-mono text-[8px] text-primary-container bg-primary-container/15 border border-primary-container/40 rounded px-1.5 py-0.5 font-bold uppercase flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">verified</span>
                          Oficial
                        </span>
                      )}
                      {beta.hidden && (
                        <span className="font-mono text-[8px] text-on-surface-variant bg-surface-container-high border border-outline-variant rounded px-1.5 py-0.5 font-bold uppercase">
                          Oculta
                        </span>
                      )}
                      {beta.banned && (
                        <span className="font-mono text-[8px] text-red-300 bg-red-950/50 border border-red-700/60 rounded px-1.5 py-0.5 font-bold uppercase">
                          Baneada
                        </span>
                      )}
                      {reports > 0 && (
                        <span className="font-mono text-[8px] text-amber-300 bg-amber-950/50 border border-amber-600/60 rounded px-1.5 py-0.5 font-bold uppercase flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">flag</span>
                          {reports}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">
                      @{beta.author} · {wall?.name || beta.wallId} · {beta.createdAt}
                    </p>
                  </div>
                </div>

                {/* Acciones del moderador */}
                <div className="flex flex-wrap gap-1.5 px-3 pb-3 border-t border-outline-variant/30 pt-2.5">
                  <ModButton
                    active={beta.official}
                    onClick={() => onModerate(beta.id, 'official', !beta.official)}
                    icon="verified"
                    label={beta.official ? 'Quitar oficial' : 'Marcar oficial'}
                    tone="gold"
                    id={`btn-mod-official-${beta.id}`}
                  />
                  <ModButton
                    active={beta.hidden}
                    onClick={() => onModerate(beta.id, 'hidden', !beta.hidden)}
                    icon={beta.hidden ? 'visibility' : 'visibility_off'}
                    label={beta.hidden ? 'Restaurar' : 'Ocultar'}
                    tone="neutral"
                    id={`btn-mod-hidden-${beta.id}`}
                  />
                  <ModButton
                    active={beta.banned}
                    onClick={() => onModerate(beta.id, 'banned', !beta.banned)}
                    icon={beta.banned ? 'lock_open' : 'block'}
                    label={beta.banned ? 'Desbanear' : 'Banear'}
                    tone="red"
                    id={`btn-mod-banned-${beta.id}`}
                  />
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar DEFINITIVAMENTE la beta "${beta.name}"?\n\nPrefiere ocultar o banear para conservar el historial.`
                        )
                      ) {
                        onDeleteBeta(beta.id);
                      }
                    }}
                    className="h-8 px-2.5 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400/70 font-mono text-[10px] flex items-center gap-1 btn-punch hover:text-red-300 ml-auto"
                    title="Eliminar definitivamente (última opción)"
                    id={`btn-mod-delete-${beta.id}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ModButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  tone: 'gold' | 'red' | 'neutral';
  id: string;
}> = ({ active, onClick, icon, label, tone, id }) => {
  const tones = {
    gold: active
      ? 'bg-primary-container text-on-primary border-primary-container font-bold'
      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-primary-container',
    red: active
      ? 'bg-red-900/50 text-red-200 border-red-600 font-bold'
      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-red-300',
    neutral: active
      ? 'bg-surface-bright text-white border-outline font-bold'
      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:text-white'
  };
  return (
    <button
      onClick={onClick}
      className={`h-8 px-2.5 rounded-lg border font-mono text-[10px] flex items-center gap-1 btn-punch ${tones[tone]}`}
      id={id}
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </button>
  );
};
