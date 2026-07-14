import React, { useState } from 'react';
import { Sector, Beta } from '../types';

interface ExploreProps {
  sectors: Sector[];
  betas: Beta[];
  onSelectBeta: (betaId: string) => void;
  onNavigateToBuild: (sectorId: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({
  sectors,
  betas,
  onSelectBeta,
  onNavigateToBuild
}) => {
  const [selectedGradeRange, setSelectedGradeRange] = useState<string>('Todos');
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);

  // Filters betas by selected grade level
  const filterBetaByGrade = (beta: Beta, range: string) => {
    if (range === 'Todos') return true;
    const gradeNum = parseInt(beta.grade.replace('V', ''), 10);
    if (isNaN(gradeNum)) return false;

    if (range === 'V0-V1') return gradeNum <= 1;
    if (range === 'V2-V3') return gradeNum === 2 || gradeNum === 3;
    if (range === 'V4-V5') return gradeNum === 4 || gradeNum === 5;
    if (range === 'V6+') return gradeNum >= 6;
    return true;
  };

  const filteredBetas = betas.filter(b => filterBetaByGrade(b, selectedGradeRange));

  const gradeRanges = ['Todos', 'V0-V1', 'V2-V3', 'V4-V5', 'V6+'];

  return (
    <div className="w-full">
      {/* Gym Header */}
      <div className="mb-8 mt-2">
        <h2 className="font-display font-black text-3xl md:text-4xl text-on-surface tracking-tight" id="explore-gym-title">
          Pirqa - Muro de Bloque
        </h2>
        <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs mt-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px] text-primary-container">location_on</span>
          <span>Miraflores, Lima</span>
        </div>
      </div>

      {/* Grade Filter (Horizontal Scroll) */}
      <div className="mb-8">
        <h3 className="font-mono text-xs text-on-surface-variant mb-3 uppercase tracking-wider">Nivel</h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x" id="grade-filter-container">
          {gradeRanges.map((range) => {
            const isActive = selectedGradeRange === range;
            return (
              <button
                key={range}
                onClick={() => setSelectedGradeRange(range)}
                className={`snap-start shrink-0 h-10 px-4 flex items-center justify-center rounded transition-all duration-150 font-mono text-xs cursor-pointer ${
                  isActive
                    ? 'border-2 border-primary-container bg-surface-container-high text-primary-container font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] -translate-y-0.5'
                    : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:border-outline'
                }`}
                id={`btn-grade-${range}`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sectors Grid */}
      <div className="mb-8">
        <h3 className="font-mono text-xs text-on-surface-variant mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary-container">grid_view</span>
          Sectores de Escalada
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="sectors-grid">
          {sectors.map((sector) => {
            // Count total and filtered betas for this sector
            const sectorBetas = betas.filter(b => b.sectorId === sector.id);
            const sectorFilteredBetas = filteredBetas.filter(b => b.sectorId === sector.id);
            const isCurrentActive = activeSectorId === sector.id;

            return (
              <div key={sector.id} className="flex flex-col">
                <article
                  onClick={() => setActiveSectorId(isCurrentActive ? null : sector.id)}
                  className={`bg-[#18181B] border rounded overflow-hidden group cursor-pointer transition-all duration-200 relative ${
                    isCurrentActive 
                      ? 'border-primary-container shadow-[4px_4px_0_0_#facc15]' 
                      : 'border-[#3F3F46] hover:border-primary-container'
                  }`}
                  id={`sector-card-${sector.id}`}
                >
                  {/* Featured Caution tape header */}
                  <div className="h-2 w-full bg-caution-tape"></div>
                  
                  <div className="h-44 w-full relative overflow-hidden bg-surface-container-lowest">
                    <img
                      alt={`Muro de ${sector.name}`}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                      src={sector.imageUrl}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Technical badge (Angle indicator) */}
                    <div className="absolute top-2 right-2 bg-background/90 border border-outline-variant px-2 py-1 rounded backdrop-blur-sm">
                      <span className="font-mono text-xs text-primary-container flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">change_history</span>
                        {sector.angle}
                      </span>
                    </div>

                    {/* Quick project info indicator */}
                    {sectorBetas.some(b => b.activeProject) && (
                      <div className="absolute top-2 left-2 bg-blue-900/85 border border-blue-500 px-2 py-1 rounded backdrop-blur-sm">
                        <span className="font-mono text-[9px] text-blue-300 flex items-center gap-1 font-semibold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[12px] animate-pulse">pending</span>
                          PROYECTO ACTIVO
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-display font-bold text-base text-on-surface group-hover:text-primary-container transition-colors">
                        {sector.name}
                      </h4>
                      <span className="bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant font-mono text-[10px] text-on-surface-variant">
                        {sectorBetas.length} {sectorBetas.length === 1 ? 'Beta' : 'Betas'}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant line-clamp-2">
                      {sector.description}
                    </p>

                    {/* Toggle Indicator */}
                    <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[11px] font-mono text-outline">
                      <span>{isCurrentActive ? 'Ocultar rutas' : 'Ver rutas de este sector'}</span>
                      <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover:text-primary-container" style={{ transform: isCurrentActive ? 'rotate(180deg)' : 'none' }}>
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
                </article>

                {/* Sub-list of betas for the active sector */}
                {isCurrentActive && (
                  <div className="mt-3 bg-surface-container p-3 rounded border border-outline-variant/60 flex flex-col gap-2 shadow-[2px_2px_0_0_#000]">
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                        Rutas en {sector.name} {selectedGradeRange !== 'Todos' ? `(${selectedGradeRange})` : ''}
                      </span>
                      <button 
                        onClick={() => onNavigateToBuild(sector.id)}
                        className="text-[10px] font-mono font-bold text-primary-container hover:underline flex items-center gap-0.5"
                        id={`add-beta-${sector.id}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        Crear aquí
                      </button>
                    </div>

                    {sectorFilteredBetas.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/70 italic p-3 text-center">
                        No hay betas en este rango de grado. ¡Registra el primero en "Build"!
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sectorFilteredBetas.map(beta => (
                          <div
                            key={beta.id}
                            onClick={() => onSelectBeta(beta.id)}
                            className="bg-background hover:bg-surface-container-high border border-outline-variant/60 hover:border-primary-container p-2.5 rounded flex items-center justify-between cursor-pointer transition-colors group/item"
                            id={`beta-sub-item-${beta.id}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono font-bold text-xs bg-surface-container-high border border-outline-variant text-primary-container w-8 h-8 rounded flex items-center justify-center shrink-0">
                                {beta.grade}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-display font-semibold text-xs text-on-surface truncate group-hover/item:text-primary-container transition-colors">
                                  {beta.name}
                                </h5>
                                <div className="flex gap-1.5 mt-0.5 overflow-x-auto no-scrollbar">
                                  {beta.styles.slice(0, 2).map(st => (
                                    <span key={st} className="text-[8px] font-mono text-outline-variant border border-outline-variant/50 px-1 rounded uppercase bg-surface-container-low">
                                      {st}
                                    </span>
                                  ))}
                                  {beta.activeProject && (
                                    <span className="text-[8px] font-mono text-blue-400 border border-blue-500/50 px-1 rounded uppercase bg-blue-950/20 font-bold">
                                      PROYECTO
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover/item:text-primary-container transform group-hover/item:translate-x-0.5 transition-all">
                              chevron_right
                            </span>
                          </div>
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
    </div>
  );
};
