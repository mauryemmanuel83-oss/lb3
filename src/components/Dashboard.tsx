import React, { useState, useMemo, useEffect } from 'react';
import { Beta, ClimberStats, ActivityMatrixDay } from '../types';
import { BOULDER_GRADES, SPORT_GRADES } from '../data';
import { Mascot } from './Mascot';
import { fetchRanking, RankingEntry } from '../api';

interface DashboardProps {
  stats: ClimberStats;
  myBetas: Beta[];
  username: string;
  userId: string;
  activityData: ActivityMatrixDay[];
  onSelectBeta: (betaId: string) => void;
  onNavigateToBuild: () => void;
  onDeleteBeta?: (betaId: string) => void;
  onToggleProject?: (betaId: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  myBetas,
  username,
  userId,
  activityData,
  onSelectBeta,
  onNavigateToBuild,
  onDeleteBeta,
  onToggleProject,
  onLogout
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'projects' | 'sends'>('all');
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [rankingError, setRankingError] = useState(false);

  // Ranking del gym en vivo
  useEffect(() => {
    fetchRanking()
      .then(setRanking)
      .catch(() => setRankingError(true));
  }, [myBetas.length]);

  // Distribución de grados desde TUS betas reales (sin datos inventados)
  const gradeDistribution = useMemo(() => {
    const allGrades = [...BOULDER_GRADES, ...SPORT_GRADES];
    const counts: { [grade: string]: number } = {};
    for (const g of allGrades) counts[g] = 0;
    myBetas.forEach((b) => {
      if (counts[b.grade] !== undefined) counts[b.grade]++;
    });
    // Solo mostramos la escala V si no tienes deportivas (y viceversa); ambas si mezclas
    const hasBoulder = myBetas.some((b) => BOULDER_GRADES.includes(b.grade));
    const hasSport = myBetas.some((b) => SPORT_GRADES.includes(b.grade));
    let visible = BOULDER_GRADES;
    if (hasSport && !hasBoulder) visible = SPORT_GRADES;
    else if (hasSport && hasBoulder) visible = allGrades.filter((g) => counts[g] > 0);
    return { counts, visible };
  }, [myBetas]);

  const peakGrade = useMemo(() => {
    const withCount = gradeDistribution.visible.filter((g) => gradeDistribution.counts[g] > 0);
    return withCount.length > 0 ? withCount[withCount.length - 1] : null;
  }, [gradeDistribution]);

  const filteredBetas = useMemo(() => {
    if (filterMode === 'projects') return myBetas.filter((b) => b.activeProject);
    if (filterMode === 'sends') return myBetas.filter((b) => !b.activeProject);
    return myBetas;
  }, [myBetas, filterMode]);

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

  const getActivityColorClass = (count: number) => {
    if (count === 0) return 'bg-surface-container-high';
    if (count === 1) return 'bg-yellow-500/25 border border-yellow-500/10';
    if (count === 2) return 'bg-yellow-500/50 border border-yellow-500/20';
    if (count === 3) return 'bg-yellow-500/75 border border-yellow-500/40';
    return 'bg-primary-container text-on-primary shadow-[0_0_8px_#facc15]';
  };

  const myRankPosition = ranking ? ranking.findIndex((r) => r.userId === userId) + 1 : 0;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end card-in">
        <div>
          <h2 className="font-display font-black text-3xl md:text-4xl text-primary-container tracking-tight" id="dashboard-title">
            @{username}
          </h2>
          <p className="font-mono text-xs text-on-surface-variant mt-2 uppercase tracking-wider">
            Nivel {stats.level} // Pirqa Lima
            {myRankPosition > 0 && ` // #${myRankPosition} del gym`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block bg-surface-container border border-outline-variant rounded-xl p-1.5">
            <Mascot state="idle" size={56} />
          </div>
          <button
            onClick={onLogout}
            className="h-10 px-3.5 rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant hover:text-red-400 hover:border-red-700/60 font-mono text-[11px] flex items-center gap-1.5 btn-punch"
            title="Cerrar sesión"
            id="btn-logout"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Bento de stats reales */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Score */}
        <div
          className="md:col-span-12 lg:col-span-8 bg-[#18181B] border border-[#3F3F46] rounded-xl overflow-hidden relative shadow-[4px_4px_0_0_#facc15] transition-all hover:-translate-y-0.5 duration-200"
          id="card-beta-score"
        >
          <div className="h-2 w-full bg-caution-tape"></div>
          <div className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-on-surface-variant uppercase border border-outline-variant px-2.5 py-1 rounded bg-surface">
                Beta Score
              </span>
              <span className="material-symbols-outlined text-primary-container text-[28px]">trending_up</span>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-display font-black text-white tracking-tighter text-6xl md:text-7xl">
                {stats.globalBetaScore.toLocaleString()}
              </span>
              <span className="font-mono text-xs text-primary-container bg-primary-container/10 px-2.5 py-1 rounded border border-primary-container/20 w-fit">
                150 pts por beta · 25 por recomendación
              </span>
            </div>
            <p className="font-sans text-[11px] text-on-surface-variant/70 uppercase tracking-wide mt-3">
              {stats.globalBetaScore === 0
                ? 'Publica tu primera beta para sumar puntos'
                : 'Puntos ganados compartiendo conocimiento'}
            </p>
          </div>
          <div
            className="absolute bottom-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at bottom right, #facc15 0%, transparent 70%)' }}
          ></div>
        </div>

        {/* Métricas */}
        <div className="md:col-span-12 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-5">
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">route</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">route</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Betas</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-white">{stats.betasPublished}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">publicadas</span>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">construction</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">construction</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Proyectos</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-primary-container">{stats.activeProjects}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">activos</span>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#3F3F46] rounded-xl p-4 col-span-2 lg:col-span-1 flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-10 text-primary-container transition-transform group-hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-[64px]">thumb_up</span>
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className="material-symbols-outlined text-[18px] text-primary-container">thumb_up</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">Recomendaciones</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-display font-black text-2xl md:text-3xl text-white">{stats.recsReceived}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">recibidas</span>
            </div>
          </div>
        </div>

        {/* ─── RANKING DEL GYM ─── */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#18181B] border border-[#3F3F46] rounded-xl p-6" id="ranking-card">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">trophy</span>
              Ranking del Gym
            </h3>
            <span className="font-mono text-[10px] text-on-surface-variant">En vivo</span>
          </div>

          {rankingError ? (
            <p className="text-xs text-on-surface-variant/70 italic">No se pudo cargar el ranking.</p>
          ) : !ranking ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-11 rounded-lg"></div>
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <p className="text-xs text-on-surface-variant/70 italic">Aún no hay escaladores registrados.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {ranking.slice(0, 10).map((entry, idx) => {
                const isMe = entry.userId === userId;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                      isMe
                        ? 'bg-primary-container/10 border-primary-container/50'
                        : 'bg-surface border-outline-variant/40'
                    }`}
                    id={`ranking-row-${idx + 1}`}
                  >
                    <span className="font-mono text-xs font-bold w-7 text-center shrink-0">
                      {medal || <span className="text-on-surface-variant">#{idx + 1}</span>}
                    </span>
                    <span
                      className={`font-display font-bold text-sm truncate flex-1 ${
                        isMe ? 'text-primary-container' : 'text-white'
                      }`}
                    >
                      @{entry.username}
                      {isMe && <span className="font-mono text-[9px] text-primary-container/70 ml-1.5">(tú)</span>}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant shrink-0 hidden sm:block">
                      {entry.betasCount} betas · {entry.recsReceived} recs
                    </span>
                    <span className="font-display font-black text-sm text-white shrink-0">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Matriz de consistencia (real) */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#18181B] border border-[#3F3F46] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Matriz de Consistencia
            </h3>
            <span className="font-mono text-[10px] text-on-surface-variant">Betas por día</span>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-3">
            <div className="flex gap-1.5 min-w-max">
              <div className="flex flex-col gap-1 pr-2 justify-between h-24 font-mono text-[8px] text-on-surface-variant/70 uppercase">
                <span>Lun</span>
                <span>Mié</span>
                <span>Vie</span>
                <span>Dom</span>
              </div>
              {matrixWeeks.map((week, wIdx) => {
                const firstDay = new Date(week[0]?.date);
                const showMonthLabel = wIdx % 4 === 0;
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const monthLabel = showMonthLabel ? months[firstDay.getMonth()] : '';
                return (
                  <div key={wIdx} className="flex flex-col gap-1 relative">
                    {showMonthLabel && (
                      <span className="absolute -top-5 left-0 font-mono text-[9px] text-on-surface-variant uppercase">
                        {monthLabel}
                      </span>
                    )}
                    {week.map((day) => (
                      <div
                        key={day.date}
                        className={`w-3.5 h-3.5 rounded-sm transition-transform duration-100 hover:scale-110 ${getActivityColorClass(day.count)}`}
                        title={`${day.date}: ${day.count} ${day.count === 1 ? 'beta' : 'betas'}`}
                      ></div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

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

        {/* Distribución de grados (real) */}
        <div className="md:col-span-12 bg-[#18181B] border border-[#3F3F46] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Distribución de Grado
            </h3>
            <span className="font-mono text-[10px] text-on-surface-variant">Tus betas</span>
          </div>

          {myBetas.length === 0 ? (
            <p className="text-xs text-on-surface-variant/70 italic text-center py-6">
              Publica betas para ver tu pirámide de grados.
            </p>
          ) : (
            <div className="flex items-end justify-between h-36 gap-1.5 md:gap-3" id="grade-distribution-chart">
              {gradeDistribution.visible.map((grade) => {
                const count = gradeDistribution.counts[grade];
                const maxCount = Math.max(...gradeDistribution.visible.map((g) => gradeDistribution.counts[g]), 1);
                const heightPercent = Math.max((count / maxCount) * 100, 3);
                const isPeak = grade === peakGrade;
                return (
                  <div key={grade} className="flex flex-col items-center w-full gap-2 group relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#27272A] border border-outline-variant text-[10px] text-white font-mono px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-40 shadow-[2px_2px_0_0_#000]">
                      {grade}: {count} {count === 1 ? 'beta' : 'betas'}
                    </div>
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
                    <span className={`font-mono text-[10px] ${isPeak ? 'text-primary-container font-black' : 'text-on-surface-variant'}`}>
                      {grade}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TUS BETAS */}
      <div className="mt-4">
        <header className="flex items-center justify-between pb-3 border-b border-[#3F3F46] flex-wrap gap-2">
          <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Tus Betas</h3>
          <div className="flex items-center gap-2">
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
                Proyectos ({myBetas.filter((b) => b.activeProject).length})
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

        <div className="flex flex-col gap-3 mt-4" id="dashboard-betas-list">
          {filteredBetas.length === 0 ? (
            <div className="bg-[#18181B] border border-[#3F3F46] p-8 text-center rounded-lg flex flex-col items-center gap-3">
              <Mascot state="empty" size={88} />
              <p className="text-sm text-on-surface-variant">
                {myBetas.length === 0 ? 'Aún no publicas ninguna beta.' : 'No hay betas en este filtro.'}
              </p>
              <button onClick={onNavigateToBuild} className="text-xs text-primary-container hover:underline font-mono font-bold">
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
                  <div
                    style={{ borderColor: beta.holdColor }}
                    className="w-12 h-12 bg-surface-container border-2 flex items-center justify-center font-display font-black text-lg text-white group-hover:scale-105 transition-transform shrink-0"
                  >
                    {beta.grade}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-base text-white group-hover:text-primary-container truncate transition-colors">
                      {beta.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                        <span className="font-mono text-[9px] text-blue-400 bg-blue-950/45 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                          PROYECTO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {onToggleProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleProject(beta.id);
                      }}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:border-blue-400 hover:text-blue-300 transition-colors bg-surface"
                      title={beta.activeProject ? 'Marcar como completado' : 'Marcar como proyecto'}
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
                        if (confirm(`¿Eliminar la beta "${beta.name}"?`)) onDeleteBeta(beta.id);
                      }}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded border border-outline-variant hover:border-red-500 hover:text-red-400 transition-colors bg-surface"
                      title="Eliminar Beta"
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
