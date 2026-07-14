import React, { useState } from 'react';
import { Wall, Beta } from '../types';
import { gradesForWallType } from '../data';
import { BetaCard } from './BetaCard';
import { Mascot } from './Mascot';

interface ExploreProps {
  walls: Wall[];
  betas: Beta[];
  onSelectBeta: (betaId: string) => void;
  onNavigateToBuild: (wallId: string) => void;
}

/**
 * Explorar: los muros reales del gym con sus fotos.
 * Cada muro filtra por SU sistema de grados (V-scale o francesa).
 */
export const Explore: React.FC<ExploreProps> = ({ walls, betas, onSelectBeta, onNavigateToBuild }) => {
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('Todos');

  const toggleWall = (wallId: string) => {
    setActiveWallId((prev) => (prev === wallId ? null : wallId));
    setGradeFilter('Todos');
  };

  return (
    <div className="w-full">
      {/* Header del gym */}
      <div className="mb-7 mt-2 card-in">
        <h2 className="font-display font-black text-3xl md:text-4xl text-on-surface tracking-tight" id="explore-gym-title">
          Pirqa · Muros
        </h2>
        <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs mt-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px] text-primary-container">location_on</span>
          <span>Miraflores, Lima</span>
          <span className="text-[#3F3F46]">·</span>
          <span>{betas.length} betas</span>
        </div>
      </div>

      {/* Muros */}
      <div className="flex flex-col gap-5" id="walls-list">
        {walls.map((wall, idx) => {
          const wallBetas = betas.filter((b) => b.wallId === wall.id);
          const isActive = activeWallId === wall.id;
          const grades = gradesForWallType(wall.type);
          const filteredBetas =
            gradeFilter === 'Todos' ? wallBetas : wallBetas.filter((b) => b.grade === gradeFilter);

          return (
            <div key={wall.id} className="card-in" style={{ animationDelay: `${idx * 70}ms` }}>
              {/* Tarjeta del muro con su foto real */}
              <article
                onClick={() => toggleWall(wall.id)}
                className={`bg-[#18181B] border rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 relative ${
                  isActive
                    ? 'border-primary-container shadow-[4px_4px_0_0_#facc15]'
                    : 'border-[#3F3F46] hover:border-primary-container shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                }`}
                id={`wall-card-${wall.id}`}
              >
                <div className="h-2 w-full bg-caution-tape"></div>

                <div className={`w-full relative overflow-hidden bg-surface-container-lowest transition-all duration-300 ${isActive ? 'h-52' : 'h-40'}`}>
                  <img
                    alt={`Foto del muro ${wall.name}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    src={wall.imageUrl}
                  />
                  {/* Gradiente para legibilidad */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent"></div>

                  {/* Nombre sobre la foto */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <h4 className="font-display font-black text-lg text-white drop-shadow group-hover:text-primary-container transition-colors">
                        {wall.name}
                      </h4>
                      <p className="font-mono text-[9px] text-white/70 uppercase tracking-wider mt-0.5 line-clamp-1">
                        {wall.description}
                      </p>
                    </div>
                    <span className="shrink-0 bg-background/85 backdrop-blur px-2.5 py-1 rounded-lg border border-outline-variant font-mono text-[10px] text-primary-container font-bold">
                      {wallBetas.length} {wallBetas.length === 1 ? 'beta' : 'betas'}
                    </span>
                  </div>

                  {/* Badges técnicos */}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-1 rounded uppercase border backdrop-blur ${
                        wall.type === 'boulder'
                          ? 'text-orange-300 border-orange-500/60 bg-orange-950/70'
                          : 'text-sky-300 border-sky-500/60 bg-sky-950/70'
                      }`}
                    >
                      {wall.type === 'boulder' ? 'Boulder' : 'Deportiva'}
                    </span>
                    <span className="bg-background/85 border border-outline-variant px-2 py-1 rounded backdrop-blur font-mono text-[9px] text-primary-container flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">change_history</span>
                      {wall.angle}
                    </span>
                  </div>

                  {wallBetas.some((b) => b.activeProject) && (
                    <div className="absolute top-2.5 right-2.5 bg-blue-950/85 border border-blue-500 px-2 py-1 rounded backdrop-blur">
                      <span className="font-mono text-[8px] text-blue-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px] animate-pulse">pending</span>
                        Proyecto
                      </span>
                    </div>
                  )}
                </div>

                {/* Indicador expandir */}
                <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-outline">
                  <span>{isActive ? 'Ocultar betas' : 'Ver betas de este muro'}</span>
                  <span
                    className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:text-primary-container"
                    style={{ transform: isActive ? 'rotate(180deg)' : 'none' }}
                  >
                    keyboard_arrow_down
                  </span>
                </div>
              </article>

              {/* Panel expandido: filtro por grado del sistema del muro + betas */}
              {isActive && (
                <div className="mt-3 bg-surface-container/70 p-4 rounded-xl border border-outline-variant/60 shadow-[2px_2px_0_0_#000] card-in">
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Grado · {wall.type === 'boulder' ? 'Escala V' : 'Francesa'}
                    </span>
                    <button
                      onClick={() => onNavigateToBuild(wall.id)}
                      className="font-mono text-[10px] font-bold text-on-primary bg-primary-container px-3 py-1.5 rounded-lg flex items-center gap-1 btn-punch shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      id={`add-beta-${wall.id}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                      Crear aquí
                    </button>
                  </div>

                  {/* Chips de grado adaptados al muro */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 snap-x">
                    {['Todos', ...grades].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGradeFilter(g)}
                        className={`snap-start shrink-0 h-9 px-3.5 flex items-center justify-center rounded-lg transition-all font-mono text-[11px] cursor-pointer ${
                          gradeFilter === g
                            ? 'border-2 border-primary-container bg-primary-container/15 text-primary-container font-bold'
                            : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'
                        }`}
                        id={`btn-filter-${wall.id}-${g}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  {filteredBetas.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                      <Mascot state="empty" size={72} />
                      <p className="text-xs text-on-surface-variant">
                        {wallBetas.length === 0
                          ? 'Nadie ha documentado una beta en este muro todavía.'
                          : `No hay betas de grado ${gradeFilter} aquí.`}
                      </p>
                      <button
                        onClick={() => onNavigateToBuild(wall.id)}
                        className="font-mono text-[11px] text-primary-container hover:underline font-bold"
                      >
                        ¡Sé el primero en crearla!
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredBetas.map((beta, i) => (
                        <BetaCard key={beta.id} beta={beta} onSelect={onSelectBeta} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
