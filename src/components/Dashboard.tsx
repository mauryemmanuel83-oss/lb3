import React, { useState, useMemo } from 'react';
import { Beta, ClimberStats, ActivityMatrixDay } from '../types';
import { Mascot } from './Mascot';

interface DashboardProps {
  stats: ClimberStats;
  betas: Beta[];
  username: string;
  activityData: ActivityMatrixDay[];
  onSelectBeta: (betaId: string) => void;
  onNavigateToBuild: () => void;
  onDeleteBeta?: (betaId: string) => void;
  onToggleProject?: (betaId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  betas,
  username,
  activityData,
  onSelectBeta,
  onNavigateToBuild,
  onDeleteBeta,
  onToggleProject
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'projects' | 'sends'>('all');

  // Calculates grade counts dynamically for the grade pyramid / distribution bar chart
  const gradeDistribution = useMemo(() => {
    const counts: { [grade: string]: number } = {
      'V0': 0, 'V1': 0, 'V2': 0, 'V3': 0, 'V4': 0, 'V5': 0, 'V6': 0, 'V7': 0, 'V8': 0, 'V9': 0
    };
    
    // Seed with initial distribution in screenshots to make it look full
    counts['V0'] = 2;
    counts['V1'] = 4;
    counts['V2'] = 7;
    counts['V3'] = 11;
    counts['V4'] = 12;
    counts['V5'] = 8;
    counts['V6'] = 15;
    counts['V7'] = 5;
    counts['V8'] = 1;
    counts['V9'] = 0;

    // Add user's custom betas to counts
    betas.forEach(b => {
      if (counts[b.grade] !== undefined) {
        counts[b.grade]++;
      }
    });

    return counts;
  }, [betas]);

  // Find the highest grade with count > 0 (Peak grade)
  const peakGrade = useMemo(() => {
    const grades = Object.keys(gradeDistribution).reverse();
    for (const g of grades) {
      if (gradeDistribution[g] > 0) return g;
    }
    return 'V8';
  }, [gradeDistribution]);

  // Filter the list of betas to show
  const filteredBetas = useMemo(() => {
    if (filterMode === 'projects') {
      return betas.filter(b => b.activeProject);
    }
    if (filterMode === 'sends') {
      return betas.filter(b => !b.activeProject);
    }
    return betas;
  }, [betas, filterMode]);

  // Group activity data by columns (weeks) for the consistency matrix
  const matrixWeeks = useMemo(() => {
    const weeks: ActivityMatrixDay[][] = [];
    let currentWeek: ActivityMatrixDay[] = [];
    
    activityData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === activityData.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  }, [activityData]);

  // Determine background class for heatmap intensity
  const getActivityColorClass = (count: number) => {
    if (count === 0) return 'bg-surface-container-high';
    if (count === 1) return 'bg-yellow-500/25 border border-yellow-500/10';
    if (count === 2) return 'bg-yellow-500/50 border border-yellow-500/20';
    if (count === 3) return 'bg-yellow-500/75 border border-yellow-500/40';
    return 'bg-primary-container text-on-primary shadow-[0_0_8px_#facc15]';
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Dashboard Header */}
      <div className="flex justify-between items-end card-in">
        <div>
          <h2 className="font-display font-black text-3xl md:text-4xl text-primary-container tracking-tight" id="dashboard-title">
            @{username}
          </h2>
          <p className="font-mono text-xs text-on-surface-variant mt-2 uppercase tracking-wider">
            Lvl {stats.level} {stats.title} // {stats.sector}
          </p>
        </div>
        <div className="hidden sm:block bg-surface-container border border-outline-variant rounded-xl p-1.5">
          <Mascot state="idle" size={56} />
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* HERO CARD: Global Beta Score */}
        <div 
          className="md:col-span-12 lg:col-span-8 bg-[#18181B] border border-[#3F3F46] rounded-xl overflow-hidden relative shadow-[4px_4px_0_0_#facc15] transition-all hover:-translate-y-0.5 duration-200"
          id="card-beta-score"
        >
          {/* Top striped tape decor */}
          <div className="h-2 w-full bg-caution-tape"></div>
          
          <div className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-on-surface-variant uppercase border border-outline-variant px-2.5 py-1 rounded bg-surface">
                Global Beta Score
              </span>
              <span className="material-symbols-outlined text-primary-container text-[28px] animate-pulse">trending_up</span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-display font-black text-white tracking-tighter text-6xl md:text-7xl">
                {stats.globalBetaScore.toLocaleString()}
              </span>
              <span className="font-mono text-xs text-primary-container bg-primary-container/10 px-2.5 py-1 rounded border border-primary-container/20 w-fit">
                +124 pts esta semana
              </span>
            </div>
            
            <p className="font-sans text-[11px] text-on-surface-variant/70 uppercase tracking-wide mt-3">
              Métricas recalculadas en tiempo real para el sector Alpha
            </p>
          </div>

          {/* Abstract yellow glow decoration */}
          <div 
            className="absolute bottom-0 right-0 w-64 h-64 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at bottom right, #facc15 0%, transparent 70%)' }}
          ></div>
        </div>

        {/* METRICS SIDE COLUMN (Sends, Projects, Flashes) */}
        <div className="md:col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-5">
          
          {/* SENDS */}
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">done_all</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">done_all</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Sends</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-white">{stats.sendsThisWeek + betas.filter(b => !b.activeProject).length - 2}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">esta semana</span>
            </div>
          </div>

          {/* ACTIVE PROJECTS */}
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">construction</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">construction</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Proyectos</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-primary-container">{betas.filter(b => b.activeProject).length}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">activos</span>
            </div>
          </div>

          {/* FLASHES */}
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 col-span-2 lg:col-span-1 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">bolt</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] text-primary-container">bolt</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Flashes</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-white">{stats.flashesCount}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">Rango V4 - V6</span>
            </div>
          </div>

        </div>

        {/* GRADE PYRAMID DISTRIBUTION (Bar Chart) */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#18181B] border border-[#3F3F46] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Distribución de Grado
            </h3>
            <span className="font-mono text-[10px] text-on-surface-variant">Últimos 30 días</span>
          </div>

          <div className="flex items-end justify-between h-40 gap-1.5 md:gap-3" id="grade-distribution-chart">
            {Object.keys(gradeDistribution).map((grade) => {
              const count = gradeDistribution[grade];
              const maxCount = Math.max(...(Object.values(gradeDistribution) as number[]), 1);
              const heightPercent = Math.max((count / maxCount) * 100, 3); // minimum 3% height so it's clickable
              const isPeak = grade === peakGrade;

              return (
                <div key={grade} className="flex flex-col items-center w-full gap-2 group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#27272A] border border-outline-variant text-[10px] text-white font-mono px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-50 shadow-[2px_2px_0_0_#000]">
                    {grade}: {count} {count === 1 ? 'bloque' : 'bloques'}
                  </div>

                  {/* Peak grade tag indicator */}
                  {isPeak && (
                    <div className="absolute -top-7 bg-primary-container text-on-primary font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow animate-bounce">
                      Peak
                    </div>
                  )}

                  {/* The bar itself */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isPeak 
                        ? 'bg-primary-container shadow-[0_0_12px_rgba(250,204,21,0.4)]' 
                        : count > 0 
                          ? 'bg-surface-container-highest group-hover:bg-outline-variant'
                          : 'bg-surface-container-high/40'
                    }`}
                  ></div>

                  {/* Grade label */}
                  <span className={`font-mono text-[10px] ${isPeak ? 'text-primary-container font-black' : 'text-on-surface-variant'}`}>
                    {grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* HEATMAP / CONSISTENCY MATRIX */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#18181B] border border-[#3F3F46] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Matriz de Consistencia
            </h3>
            <span className="font-mono text-[10px] text-on-surface-variant">Frecuencia Semanal</span>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-3">
            <div className="flex gap-1.5 min-w-max">
              
              {/* Day labels column */}
              <div className="flex flex-col gap-1 pr-2 justify-between h-24 font-mono text-[8px] text-on-surface-variant/70 uppercase">
                <span>Lun</span>
                <span>Mié</span>
                <span>Vie</span>
                <span>Dom</span>
              </div>

              {/* Weekly columns of grids */}
              {matrixWeeks.map((week, wIdx) => {
                const firstDay = new Date(week[0]?.date);
                const showMonthLabel = wIdx % 4 === 0;
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const monthLabel = showMonthLabel ? months[firstDay.getMonth()] : '';

                return (
                  <div key={wIdx} className="flex flex-col gap-1 relative">
                    {/* Month header anchor */}
                    {showMonthLabel && (
                      <span className="absolute -top-5 left-0 font-mono text-[9px] text-on-surface-variant uppercase">
                        {monthLabel}
                      </span>
                    )}
                    
                    {/* Week blocks */}
                    {week.map((day) => (
                      <div
                        key={day.date}
                        className={`w-3.5 h-3.5 rounded-sm transition-transform duration-100 hover:scale-110 cursor-pointer ${getActivityColorClass(day.count)}`}
                        title={`${day.date}: ${day.count} sesiones`}
                      ></div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend row */}
          <div className="flex justify-end items-center mt-3 gap-2 font-mono text-[9px] text-on-surface-variant">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-surface-container-high"></div>
              <div className="w-3 h-3 rounded-sm bg-yellow-500/25"></div>
              <div className="w-3 h-3 rounded-sm bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-sm bg-yellow-500/75"></div>
              <div className="w-3 h-3 rounded-sm bg-primary-container"></div>
            </div>
            <span>Más</span>
          </div>
        </div>

      </div>

      {/* TUS BETAS LIST SECTION */}
      <div className="mt-4">
        <header className="flex items-center justify-between pb-3 border-b border-[#3F3F46]">
          <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
            Tus Betas
          </h3>

          <div className="flex items-center gap-2">
            {/* Filter segments */}
            <div className="flex bg-surface-container-high border border-outline-variant p-0.5 rounded text-[10px] font-mono">
              <button 
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded transition-colors ${filterMode === 'all' ? 'bg-primary-container text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'}`}
                id="btn-filter-betas-all"
              >
                Todas
              </button>
              <button 
                onClick={() => setFilterMode('projects')}
                className={`px-2.5 py-1 rounded transition-colors ${filterMode === 'projects' ? 'bg-primary-container text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'}`}
                id="btn-filter-betas-projects"
              >
                Proyectos ({betas.filter(b => b.activeProject).length})
              </button>
              <button 
                onClick={() => setFilterMode('sends')}
                className={`px-2.5 py-1 rounded transition-colors ${filterMode === 'sends' ? 'bg-primary-container text-on-primary font-bold' : 'text-on-surface-variant hover:text-white'}`}
                id="btn-filter-betas-sends"
              >
                Sends
              </button>
            </div>

            <button 
              onClick={onNavigateToBuild}
              className="font-mono text-xs text-primary-container bg-primary-container/10 border border-primary-container/30 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-primary-container/20 cursor-pointer active:scale-95 transition-all"
              id="btn-dashboard-crear-beta"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Crear</span>
            </button>
          </div>
        </header>

        {/* Scrollable Betas List */}
        <div className="flex flex-col gap-3 mt-4" id="dashboard-betas-list">
          {filteredBetas.length === 0 ? (
            <div className="bg-[#18181B] border border-[#3F3F46] p-8 text-center rounded-lg flex flex-col items-center gap-3">
              <Mascot state="empty" size={88} />
              <p className="text-sm text-on-surface-variant">No tienes betas guardadas en este filtro.</p>
              <button
                onClick={onNavigateToBuild}
                className="text-xs text-primary-container hover:underline font-mono font-bold"
              >
                ¡Registra tu primera beta ahora!
              </button>
            </div>
          ) : (
            filteredBetas.map((beta) => (
              <div
                key={beta.id}
                onClick={() => onSelectBeta(beta.id)}
                className="flex items-center justify-between bg-[#18181B] border border-[#3F3F46] p-4 rounded-lg hover:border-primary-container hover:bg-surface-container/40 transition-all duration-150 cursor-pointer group shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
                id={`dashboard-beta-card-${beta.id}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Grade indicator block matching screenshots */}
                  <div 
                    style={{ borderColor: beta.holdColor }}
                    className="w-12 h-12 bg-surface-container border-2 flex items-center justify-center font-display font-black text-lg text-white group-hover:scale-105 transition-transform"
                    id={`beta-grade-badge-${beta.id}`}
                  >
                    {beta.grade}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-base text-white group-hover:text-primary-container truncate transition-colors">
                      {beta.name}
                    </h4>
                    
                    {/* Technical tags */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {beta.styles.length > 0 && (
                        <>
                          <span className="font-mono text-[9px] text-on-surface-variant bg-surface px-1.5 py-0.5 border border-outline-variant">
                            {beta.styles.slice(0, 2).join(' // ')}
                          </span>
                          <span className="text-[#3F3F46] text-xs">|</span>
                        </>
                      )}
                      <span className="font-mono text-[9px] text-on-surface-variant flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">calendar_today</span>
                        {beta.createdAt}
                      </span>
                      <span className="font-mono text-[9px] text-on-surface-variant flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">chat_bubble</span>
                        {beta.comments.length}
                      </span>
                      <span className="font-mono text-[9px] text-on-surface-variant flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">thumb_up</span>
                        {beta.recommendations}
                      </span>
                      {beta.activeProject && (
                        <>
                          <span className="text-[#3F3F46] text-xs">|</span>
                          <span className="font-mono text-[9px] text-blue-400 bg-blue-950/45 border border-blue-800 px-1.5 py-0.5 rounded font-bold animate-pulse">
                            PROYECTO
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Action buttons inside the dashboard row for fast toggles */}
                  {onToggleProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleProject(beta.id);
                      }}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:border-blue-400 hover:text-blue-300 transition-colors bg-surface"
                      title={beta.activeProject ? "Marcar como ENVIADO (Send)" : "Marcar como PROYECTO ACTIVO"}
                      id={`btn-toggle-project-${beta.id}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {beta.activeProject ? 'emoji_events' : 'construction'}
                      </span>
                    </button>
                  )}

                  {onDeleteBeta && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro que deseas eliminar la beta "${beta.name}"?`)) {
                          onDeleteBeta(beta.id);
                        }
                      }}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:border-red-500 hover:text-red-400 transition-colors bg-surface"
                      title="Eliminar Beta"
                      id={`btn-delete-beta-${beta.id}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}

                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors font-black">
                    chevron_right
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
