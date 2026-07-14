import React from 'react';
import { Beta, Sector } from '../types';

interface BetaDetailProps {
  beta: Beta;
  sectors: Sector[];
  onClose: () => void;
  onDelete?: (betaId: string) => void;
  onToggleProject?: (betaId: string) => void;
}

export const BetaDetail: React.FC<BetaDetailProps> = ({
  beta,
  sectors,
  onClose,
  onDelete,
  onToggleProject
}) => {
  const sector = sectors.find(s => s.id === beta.sectorId);

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Container Card */}
      <div 
        className="bg-surface border border-outline-variant rounded-xl w-full max-w-4xl overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        id="beta-detail-modal"
      >
        {/* Striped caution detail on top */}
        <div className="h-2 w-full bg-caution-tape"></div>

        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 bg-surface/80 hover:bg-surface border border-outline-variant text-on-surface-variant hover:text-white flex items-center justify-center rounded-full transition-colors"
          title="Cerrar"
          id="btn-close-detail"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Modal Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* LEFT COLUMN: Climber annotated climb wall image (span 7) */}
          <div className="md:col-span-7 bg-surface-container-lowest relative aspect-[4/5] md:aspect-auto md:h-[600px] border-b md:border-b-0 md:border-r border-outline-variant">
            <img
              alt={beta.name}
              className="w-full h-full object-cover"
              src={beta.imageUrl}
              referrerPolicy="no-referrer"
            />

            {/* Markers overlay */}
            {beta.markers.map((marker) => {
              let markerBgColor = 'border-primary-container bg-surface/80 text-primary-container';
              
              if (marker.type === 'START') {
                markerBgColor = 'border-primary-container bg-primary-container/20 text-primary-container shadow-[0_0_12px_#facc15]';
              } else if (marker.type === 'TOP') {
                markerBgColor = 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
              } else if (marker.type === 'SEQ') {
                markerBgColor = 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-black';
              } else if (marker.type === 'ARROW') {
                markerBgColor = 'border-purple-500 bg-purple-500/20 text-purple-400';
              }

              return (
                <div
                  key={marker.id}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  className={`absolute w-8 h-8 -ml-4 -mt-4 border-2 rounded-full flex items-center justify-center text-xs backdrop-blur-sm ${markerBgColor}`}
                  id={`detail-marker-${marker.id}`}
                >
                  {marker.type === 'SEQ' ? (
                    <span className="font-mono text-[11px] font-bold">{marker.label}</span>
                  ) : marker.type === 'ARROW' ? (
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  ) : (
                    <span className="font-mono text-[9px] font-semibold">{marker.type}</span>
                  )}
                </div>
              );
            })}

            {/* Quick angle indicator overlay */}
            {sector && (
              <div className="absolute bottom-4 left-4 bg-background/90 border border-outline-variant px-3 py-1.5 rounded-md backdrop-blur">
                <span className="font-mono text-[10px] text-primary-container flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">change_history</span>
                  Sector: {sector.name} ({sector.angle})
                </span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Climbing sheets meta and notes (span 5) */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between md:h-[600px] overflow-y-auto bg-surface-container-low">
            <div className="space-y-6">
              
              {/* Header block with Grade and Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span 
                    style={{ borderColor: beta.holdColor }}
                    className="font-display font-black text-white text-lg bg-surface border-2 px-3 py-1 rounded shadow"
                  >
                    {beta.grade}
                  </span>
                  {beta.activeProject && (
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-950/50 border border-blue-500/50 px-2.5 py-1 rounded font-bold uppercase animate-pulse">
                      PROYECTO ACTIVO
                    </span>
                  )}
                </div>
                
                <h3 className="font-display font-black text-2xl text-white tracking-tight leading-tight">
                  {beta.name}
                </h3>

                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant uppercase">
                  <span>Por @{beta.author}</span>
                  <span className="text-[#3F3F46]">|</span>
                  <span>{beta.createdAt}</span>
                </div>
              </div>

              {/* Gym and Sector Info block */}
              {sector && (
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/60 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container text-2xl">location_away</span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-display font-bold text-white uppercase tracking-wider">{sector.name}</h5>
                    <p className="text-[10px] font-mono text-on-surface-variant mt-0.5 leading-snug">{sector.description}</p>
                  </div>
                </div>
              )}

              {/* Style tags list */}
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Etiquetas de Estilo
                </h4>
                <div className="flex flex-wrap gap-2">
                  {beta.styles.map(st => (
                    <span key={st} className="font-mono text-[10px] text-primary-container bg-primary-container/10 border border-primary-container/20 px-2.5 py-1 rounded font-bold uppercase">
                      {st}
                    </span>
                  ))}
                  <span 
                    style={{ color: beta.holdColor, borderColor: beta.holdColor + '40' }}
                    className="font-mono text-[10px] bg-white/5 border px-2.5 py-1 rounded font-bold uppercase flex items-center gap-1"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: beta.holdColor }}></span>
                    Presas
                  </span>
                </div>
              </div>

              {/* Technical notes */}
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Notas de Bloque / Crux Details
                </h4>
                <div className="bg-background border border-outline-variant/60 rounded-lg p-3.5 leading-relaxed text-xs text-on-surface whitespace-pre-wrap font-sans">
                  {beta.notes || "No hay comentarios técnicos registrados para este bloque."}
                </div>
              </div>

            </div>

            {/* Action buttons bar */}
            <div className="pt-6 border-t border-outline-variant/40 flex flex-col gap-2 mt-6">
              
              {onToggleProject && (
                <button
                  onClick={() => onToggleProject(beta.id)}
                  className={`w-full h-11 rounded font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    beta.activeProject
                      ? 'bg-primary-container text-on-primary hover:bg-yellow-400'
                      : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-bright'
                  }`}
                  id="btn-detail-toggle-project"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {beta.activeProject ? 'emoji_events' : 'construction'}
                  </span>
                  <span>{beta.activeProject ? 'Marcar como COMPLETADO (Send)' : 'Marcar como PROYECTO ACTIVO'}</span>
                </button>
              )}

              <div className="flex gap-2">
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro que deseas eliminar la beta "${beta.name}"?`)) {
                        onDelete(beta.id);
                        onClose();
                      }
                    }}
                    className="flex-1 h-11 bg-red-900/20 hover:bg-red-900/40 border border-red-700/60 text-red-400 rounded font-mono text-xs cursor-pointer transition-colors flex items-center justify-center gap-1"
                    id="btn-detail-delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Eliminar</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="flex-1 h-11 bg-surface-container-high hover:bg-surface-bright border border-outline-variant text-on-surface font-mono text-xs rounded cursor-pointer transition-colors flex items-center justify-center"
                  id="btn-detail-close-bottom"
                >
                  Volver
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
