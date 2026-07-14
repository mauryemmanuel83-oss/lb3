import React from 'react';
import { Marker, Stroke, TextLabel } from '../types';

interface BetaOverlayProps {
  markers: Marker[];
  strokes: Stroke[];
  texts: TextLabel[];
  onRemoveMarker?: (id: string, e: React.MouseEvent) => void;
  onRemoveText?: (id: string, e: React.MouseEvent) => void;
  compact?: boolean; // versión mini para thumbnails
}

// Cabeza de flecha calculada en espacio porcentual
const arrowHead = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return null;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const len = 3.2;
  const spread = Math.PI / 7;
  const p1 = {
    x: b.x - len * Math.cos(angle - spread),
    y: b.y - len * Math.sin(angle - spread)
  };
  const p2 = {
    x: b.x - len * Math.cos(angle + spread),
    y: b.y - len * Math.sin(angle + spread)
  };
  return `${p1.x},${p1.y} ${b.x},${b.y} ${p2.x},${p2.y}`;
};

/**
 * Capa de anotaciones de una Beta: trazos SVG (lápiz/flechas),
 * marcadores (START/TOP/SEQ) y etiquetas de texto.
 * Coordenadas en % para escalar con la foto.
 */
export const BetaOverlay: React.FC<BetaOverlayProps> = ({
  markers,
  strokes,
  texts,
  onRemoveMarker,
  onRemoveText,
  compact = false
}) => {
  const markerSize = compact ? 'w-4 h-4 -ml-2 -mt-2 border text-[6px]' : 'w-8 h-8 -ml-4 -mt-4 border-2 text-xs';

  return (
    <>
      {/* Trazos vectoriales */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {strokes.map((s) => {
          const pts = s.points.map((p) => `${p.x},${p.y}`).join(' ');
          const head = s.tool === 'ARROW' ? arrowHead(s.points) : null;
          return (
            <g key={s.id}>
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={compact ? 1.5 : 3}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              {head && (
                <polyline
                  points={head}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={compact ? 1.5 : 3}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Marcadores START / TOP / SEQ */}
      {markers.map((marker) => {
        let cls = 'border-primary-container bg-surface/80 text-primary-container';
        if (marker.type === 'START') {
          cls = 'border-primary-container bg-primary-container/25 text-primary-container shadow-[0_0_12px_#facc15]';
        } else if (marker.type === 'TOP') {
          cls = 'border-red-500 bg-red-500/25 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
        } else if (marker.type === 'SEQ') {
          cls = 'border-yellow-500 bg-yellow-500/15 text-yellow-400 font-black';
        }

        return (
          <div
            key={marker.id}
            onClick={onRemoveMarker ? (e) => onRemoveMarker(marker.id, e) : undefined}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            className={`absolute rounded-full flex items-center justify-center backdrop-blur-sm ${markerSize} ${cls} ${
              onRemoveMarker ? 'cursor-pointer hover:scale-110 transition-transform' : ''
            }`}
            title={onRemoveMarker ? 'Toca para eliminar' : undefined}
          >
            {marker.type === 'SEQ' ? (
              <span className={`font-mono font-bold ${compact ? 'text-[6px]' : 'text-[11px]'}`}>{marker.label}</span>
            ) : (
              <span className={`font-mono font-semibold ${compact ? 'text-[5px]' : 'text-[9px]'}`}>{marker.type}</span>
            )}
          </div>
        );
      })}

      {/* Etiquetas de texto */}
      {texts.map((t) => (
        <div
          key={t.id}
          onClick={onRemoveText ? (e) => onRemoveText(t.id, e) : undefined}
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            color: t.color,
            borderColor: t.color + '80'
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 bg-background/85 backdrop-blur-sm border rounded px-1.5 py-0.5 font-mono font-bold whitespace-nowrap ${
            compact ? 'text-[5px]' : 'text-[11px]'
          } ${onRemoveText ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
          title={onRemoveText ? 'Toca para eliminar' : undefined}
        >
          {t.text}
        </div>
      ))}
    </>
  );
};
