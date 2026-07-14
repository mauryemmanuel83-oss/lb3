import React from 'react';
import { Beta, Tab } from '../types';
import { Mascot } from './Mascot';
import { BetaCard } from './BetaCard';

interface HomeProps {
  username: string;
  betas: Beta[];
  onNavigate: (tab: Tab) => void;
  onSelectBeta: (betaId: string) => void;
}

/**
 * Pantalla principal: deja claro qué hace la app y ofrece
 * accesos grandes y táctiles a las 4 áreas clave.
 */
export const Home: React.FC<HomeProps> = ({ username, betas, onNavigate, onSelectBeta }) => {
  const recentBetas = betas.slice(0, 3);

  const quickActions: {
    label: string;
    sub: string;
    icon: string;
    tab: Tab;
    highlight?: boolean;
  }[] = [
    { label: 'Crear Beta', sub: 'Foto + dibujo en 1 minuto', icon: 'add_a_photo', tab: 'build', highlight: true },
    { label: 'Explorar Betas', sub: 'Soluciones de la comunidad', icon: 'explore', tab: 'explore' },
    { label: 'Muros del Gym', sub: 'Boulder y deportiva', icon: 'terrain', tab: 'explore' },
    { label: 'Mi Perfil', sub: 'Progreso y tus betas', icon: 'person', tab: 'dashboard' }
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Hero: mascota + propósito */}
      <div className="mt-2 flex items-center gap-4 card-in">
        <div className="shrink-0 bg-surface-container border-2 border-outline-variant rounded-xl p-2 shadow-[4px_4px_0_0_#facc15]">
          <Mascot state="idle" size={72} />
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-black text-2xl md:text-4xl text-white tracking-tight leading-tight">
            Hola, <span className="text-primary-container">@{username}</span>
          </h2>
          <p className="font-mono text-[11px] md:text-xs text-on-surface-variant mt-1.5 uppercase tracking-wider leading-relaxed">
            Documenta y comparte la solución de cada bloque
          </p>
        </div>
      </div>

      {/* Accesos rápidos: tarjetas grandes y táctiles */}
      <div className="grid grid-cols-2 gap-3.5">
        {quickActions.map((action, i) => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.tab)}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`card-in btn-punch text-left rounded-xl p-4 md:p-5 min-h-[110px] md:min-h-[130px] flex flex-col justify-between border transition-colors ${
              action.highlight
                ? 'bg-primary-container text-on-primary border-primary-container shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                : 'bg-[#18181B] text-white border-[#3F3F46] hover:border-primary-container shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[30px] md:text-[34px] ${
                action.highlight ? 'text-on-primary' : 'text-primary-container'
              }`}
            >
              {action.icon}
            </span>
            <div>
              <span className="font-display font-black text-sm md:text-base block leading-tight">{action.label}</span>
              <span
                className={`font-mono text-[9px] md:text-[10px] uppercase tracking-wide block mt-1 ${
                  action.highlight ? 'text-on-primary/70' : 'text-on-surface-variant'
                }`}
              >
                {action.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Betas recientes de la comunidad */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-white uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">history</span>
            Betas recientes
          </h3>
          <button
            onClick={() => onNavigate('explore')}
            className="font-mono text-[10px] text-primary-container hover:underline flex items-center gap-0.5"
          >
            Ver todas
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </button>
        </div>

        {recentBetas.length === 0 ? (
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <Mascot state="empty" size={80} />
            <p className="text-sm text-on-surface-variant">Aún no hay betas. ¡Documenta la primera!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBetas.map((beta, i) => (
              <BetaCard key={beta.id} beta={beta} onSelect={onSelectBeta} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Manifiesto compacto */}
      <div className="bg-surface-container/60 border border-outline-variant/50 rounded-xl p-4 flex items-start gap-3 card-in">
        <span className="material-symbols-outlined text-primary-container text-[20px] mt-0.5">school</span>
        <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
          <strong className="text-white">La Beta</strong> es el repositorio técnico de tu gym: cada beta es una
          solución que cualquier escalador puede consultar, aprender y mejorar. Conocimiento compartido, no likes.
        </p>
      </div>
    </div>
  );
};
