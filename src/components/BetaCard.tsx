import React from 'react';
import { Beta } from '../types';
import { BetaOverlay } from './BetaOverlay';
import { STATUS_META } from '../lib/betaStatus';

interface BetaCardProps {
  beta: Beta;
  onSelect: (betaId: string) => void;
  index?: number; // para stagger de entrada
}

/**
 * Tarjeta de Beta: foto anotada, grado, color de presas, autor,
 * fecha, comentarios y recomendaciones. Toda la info esencial de un vistazo.
 */
export const BetaCard: React.FC<BetaCardProps> = ({ beta, onSelect, index = 0 }) => {
  const status = STATUS_META[beta.status];
  const isStale = beta.status !== 'active';

  return (
    <article
      onClick={() => onSelect(beta.id)}
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
      className={`card-in bg-[#18181B] border rounded-xl overflow-hidden cursor-pointer group transition-colors duration-200 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
        beta.status === 'removed'
          ? 'border-red-900/50 hover:border-red-600/60'
          : beta.status === 'holds_changed'
            ? 'border-amber-900/50 hover:border-amber-500/60'
            : 'border-[#3F3F46] hover:border-primary-container'
      }`}
    >
      {/* Foto con anotaciones en miniatura */}
      <div className="relative w-full aspect-[4/3] bg-surface-container-lowest overflow-hidden">
        <img
          src={beta.imageUrl}
          alt={beta.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
            isStale ? 'grayscale-[60%] opacity-80' : ''
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Badge de estado del ciclo de vida (solo si no está activa) */}
        {isStale && (
          <div
            className={`absolute bottom-2.5 left-2.5 flex items-center gap-1 border rounded px-2 py-0.5 backdrop-blur font-mono text-[9px] font-bold uppercase tracking-wider ${status.chip}`}
          >
            <span className="material-symbols-outlined text-[12px]">{status.icon}</span>
            {status.label}
          </div>
        )}
        <div className="absolute inset-0">
          <BetaOverlay markers={beta.markers} strokes={beta.strokes} texts={beta.texts} compact />
        </div>

        {/* Grado prominente sobre la foto */}
        <div
          style={{ borderColor: beta.holdColor }}
          className="absolute top-2.5 left-2.5 bg-background/90 backdrop-blur border-2 rounded-lg px-2.5 py-1 font-display font-black text-white text-base shadow-[2px_2px_0_0_rgba(0,0,0,0.8)]"
        >
          {beta.grade}
        </div>

        {/* Color de presas */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-background/90 backdrop-blur border border-outline-variant rounded-full px-2 py-1">
          <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: beta.holdColor }}></span>
          <span className="font-mono text-[8px] text-on-surface-variant uppercase">presas</span>
        </div>

        {beta.activeProject && !isStale && (
          <div className="absolute bottom-2.5 left-2.5 bg-blue-950/90 border border-blue-500 rounded px-2 py-0.5 backdrop-blur">
            <span className="font-mono text-[9px] text-blue-300 font-bold uppercase tracking-wider">Proyecto</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h4 className="font-display font-bold text-sm text-white group-hover:text-primary-container transition-colors truncate">
          {beta.name}
        </h4>

        <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-on-surface-variant">
          <span className="truncate">@{beta.author}</span>
          <span className="text-[#3F3F46]">·</span>
          <span className="whitespace-nowrap">{beta.createdAt}</span>
        </div>

        {/* Comentarios + recomendaciones */}
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-outline-variant/30">
          <span className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
            {beta.comments.length}
          </span>
          <span
            className={`flex items-center gap-1 font-mono text-[10px] ${
              beta.recommendedByMe ? 'text-primary-container font-bold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">thumb_up</span>
            {beta.recommendations}
          </span>
          <span className="ml-auto flex gap-1">
            {beta.styles.slice(0, 2).map((st) => (
              <span key={st} className="font-mono text-[8px] text-outline border border-outline-variant/50 px-1 py-0.5 rounded uppercase">
                {st}
              </span>
            ))}
          </span>
        </div>
      </div>
    </article>
  );
};
