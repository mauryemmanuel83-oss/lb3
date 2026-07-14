import React, { useId } from 'react';
import { MascotState } from '../types';

interface MascotProps {
  state?: MascotState;
  size?: number; // px del lado del cuadrado
  className?: string;
}

/**
 * Escalador pixel-art dibujado con rects SVG y animado por CSS
 * (keyframes en index.css). Cada estado cambia la pose y el loop:
 *  - idle:       respira y se balancea suave
 *  - loading:    escala — las presas bajan (él "sube") y alterna brazos
 *  - publishing: sube con impulso, presas bajan más rápido
 *  - success:    brazos arriba, salta y suelta confeti
 *  - error:      se resbala — cuelga de un brazo y patalea
 *  - empty:      busca ruta — mira a los lados con un "?"
 */
export const Mascot: React.FC<MascotProps> = ({ state = 'idle', size = 96, className = '' }) => {
  const px = (n: number) => n * 4; // grid 16x16 en viewBox 64x64
  const clipId = useId();

  const SKIN = '#f2c094';
  const SHIRT = '#facc15';
  const SHIRT_DARK = '#ca9a04';
  const PANTS = '#3f4a5f';
  const SHOE = '#ef4444';
  const HAIR = '#26221c';
  const CHALK = '#e8e4da';

  // En tamaños pequeños (iconos) la pared de fondo hace ruido visual
  const showWall =
    size >= 48 && (state === 'loading' || state === 'publishing' || state === 'idle' || state === 'error');
  const climbing = state === 'loading' || state === 'publishing';

  return (
    <div
      className={`mascot mascot--${state} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mascota escaladora: ${state}`}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} shapeRendering="crispEdges">
        {/* ── Pared de fondo con presas (scroll = ascenso) ── */}
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="64" height="64" />
          </clipPath>
        </defs>
        {showWall && (
          <g className="mascot__wall" clipPath={`url(#${clipId})`}>
            <g className="mascot__holds">
              {/* dos copias apiladas para loop continuo */}
              {[0, 64].map(offset => (
                <g key={offset} transform={`translate(0 ${offset})`}>
                  <rect x={px(1)} y={px(1)} width={px(1)} height={px(1)} fill="#8b5cf6" />
                  <rect x={px(13)} y={px(3)} width={px(1)} height={px(1)} fill="#22c55e" />
                  <rect x={px(2)} y={px(7)} width={px(1)} height={px(1)} fill="#3b82f6" />
                  <rect x={px(14)} y={px(9)} width={px(1)} height={px(1)} fill="#ec4899" />
                  <rect x={px(1)} y={px(12)} width={px(1)} height={px(1)} fill="#f97316" />
                  <rect x={px(13)} y={px(14)} width={px(1)} height={px(1)} fill="#14b8a6" />
                </g>
              ))}
            </g>
          </g>
        )}

        {/* ── Escalador ── */}
        <g className="mascot__body">
          {/* Brazo izquierdo */}
          <g className="mascot__arm-l">
            <rect x={px(4)} y={px(4)} width={px(1)} height={px(1)} fill={SKIN} />
            <rect x={px(4)} y={px(5)} width={px(1)} height={px(2)} fill={SHIRT_DARK} />
          </g>
          {/* Brazo derecho */}
          <g className="mascot__arm-r">
            <rect x={px(11)} y={px(4)} width={px(1)} height={px(1)} fill={SKIN} />
            <rect x={px(11)} y={px(5)} width={px(1)} height={px(2)} fill={SHIRT_DARK} />
          </g>

          {/* Pelo + cabeza */}
          <rect x={px(6)} y={px(1)} width={px(4)} height={px(1)} fill={HAIR} />
          <rect x={px(6)} y={px(2)} width={px(4)} height={px(2)} fill={SKIN} />
          {/* Ojos (parte de atrás de la cabeza en escalada; se ven al buscar) */}
          <g className="mascot__eyes">
            <rect x={px(6.5)} y={px(2.5)} width={px(0.5)} height={px(0.5)} fill={HAIR} />
            <rect x={px(8.5)} y={px(2.5)} width={px(0.5)} height={px(0.5)} fill={HAIR} />
          </g>

          {/* Torso */}
          <rect x={px(5)} y={px(4)} width={px(6)} height={px(4)} fill={SHIRT} />
          <rect x={px(5)} y={px(7)} width={px(6)} height={px(1)} fill={SHIRT_DARK} />
          {/* Bolsa de magnesio */}
          <rect x={px(10)} y={px(8)} width={px(1.5)} height={px(1.5)} fill={CHALK} />

          {/* Piernas */}
          <g className="mascot__leg-l">
            <rect x={px(5.5)} y={px(8)} width={px(1.5)} height={px(3)} fill={PANTS} />
            <rect x={px(5)} y={px(11)} width={px(2)} height={px(1)} fill={SHOE} />
          </g>
          <g className="mascot__leg-r">
            <rect x={px(9)} y={px(8)} width={px(1.5)} height={px(3)} fill={PANTS} />
            <rect x={px(9)} y={px(11)} width={px(2)} height={px(1)} fill={SHOE} />
          </g>
        </g>

        {/* ── Extras por estado ── */}
        {state === 'success' && (
          <g className="mascot__confetti">
            <rect x={px(2)} y={px(3)} width={px(0.8)} height={px(0.8)} fill="#ec4899" className="confetti-1" />
            <rect x={px(13)} y={px(2)} width={px(0.8)} height={px(0.8)} fill="#22c55e" className="confetti-2" />
            <rect x={px(4)} y={px(1)} width={px(0.8)} height={px(0.8)} fill="#3b82f6" className="confetti-3" />
            <rect x={px(11)} y={px(4)} width={px(0.8)} height={px(0.8)} fill="#facc15" className="confetti-4" />
            <rect x={px(8)} y={px(0.5)} width={px(0.8)} height={px(0.8)} fill="#f97316" className="confetti-5" />
          </g>
        )}

        {state === 'error' && (
          <g className="mascot__sweat">
            <rect x={px(11.5)} y={px(1.5)} width={px(0.7)} height={px(0.7)} fill="#7dd3fc" />
          </g>
        )}

        {state === 'empty' && (
          <g className="mascot__question">
            <text
              x={px(12.5)}
              y={px(3.5)}
              fontSize={px(3)}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="bold"
              fill={SHIRT}
            >
              ?
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
