/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Explore } from './components/Explore';
import { Build } from './components/Build';
import { Dashboard } from './components/Dashboard';
import { BetaDetail } from './components/BetaDetail';
import { Beta, Wall, Tab, ReportReason, UserStats, isModeratorRole } from './types';
import { AscentWithBeta } from './lib/ascents';
import { Moderation } from './components/Moderation';
import { INITIAL_WALLS, buildActivityMatrix } from './data';
import { isSupabaseConfigured } from './lib/supabase';
import * as api from './api';

// Skeleton de carga inicial (shimmer)
const AppSkeleton = () => (
  <div className="min-h-screen bg-background pt-20 pb-24 px-5 max-w-[1200px] mx-auto">
    <div className="fixed top-0 left-0 w-full h-14 bg-background border-b border-outline-variant flex items-center px-5">
      <div className="skeleton h-7 w-28 rounded"></div>
    </div>
    <div className="flex items-center gap-4 mb-8">
      <div className="skeleton w-20 h-20 rounded-xl"></div>
      <div className="flex-1">
        <div className="skeleton h-7 w-2/3 rounded mb-2"></div>
        <div className="skeleton h-3 w-1/2 rounded"></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3.5 mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-28 rounded-xl"></div>
      ))}
    </div>
    <div className="skeleton h-4 w-40 rounded mb-4"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-56 rounded-xl"></div>
      ))}
    </div>
  </div>
);

// Pantalla de configuración pendiente (falta la anon key)
const SetupScreen = () => (
  <div className="min-h-screen bg-background bg-tech-grid flex items-center justify-center p-6">
    <div className="max-w-lg bg-surface-container border border-outline-variant rounded-xl p-6 shadow-[4px_4px_0_0_#facc15] space-y-4">
      <h1 className="font-display font-black text-xl text-primary-container">Falta conectar Supabase</h1>
      <ol className="font-sans text-sm text-on-surface space-y-3 list-decimal list-inside leading-relaxed">
        <li>
          En el dashboard de Supabase ve a <strong>Project Settings → API Keys</strong> y copia la clave{' '}
          <code className="bg-background px-1.5 py-0.5 rounded text-primary-container text-xs">anon / public</code>.
        </li>
        <li>
          Pégala en el archivo <code className="bg-background px-1.5 py-0.5 rounded text-primary-container text-xs">.env.local</code>{' '}
          del proyecto, en <code className="bg-background px-1.5 py-0.5 rounded text-primary-container text-xs">VITE_SUPABASE_ANON_KEY</code>.
        </li>
        <li>Reinicia el servidor de desarrollo.</li>
      </ol>
      <p className="font-mono text-[10px] text-on-surface-variant uppercase">
        También corre supabase/setup.sql en el SQL Editor si aún no lo hiciste.
      </p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<api.SessionUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoadingBetas, setIsLoadingBetas] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  const [betas, setBetas] = useState<Beta[]>([]);
  const [walls] = useState<Wall[]>(INITIAL_WALLS);

  const [selectedBetaId, setSelectedBetaId] = useState<string | null>(null);
  const [buildInitialWallId, setBuildInitialWallId] = useState<string | null>(null);
  const [buildReplacesId, setBuildReplacesId] = useState<string | null>(null);
  const [buildReplacesName, setBuildReplacesName] = useState<string | null>(null);
  const [buildSession, setBuildSession] = useState(0);

  // Estadísticas calculadas en la base de datos (vista user_stats)
  const [dbStats, setDbStats] = useState<UserStats | null>(null);

  const refreshBetas = useCallback(async (userId: string | null) => {
    setIsLoadingBetas(true);
    setLoadError(null);
    try {
      const fresh = await api.fetchBetas(userId);
      setBetas(fresh);
      // Las stats se recalculan solas en la DB tras cada ascenso
      if (userId) setDbStats(await api.fetchUserStats(userId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error cargando betas');
    } finally {
      setIsLoadingBetas(false);
    }
  }, []);

  // Sesión persistida + carga inicial
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsBooting(false);
      return;
    }
    (async () => {
      const current = await api.getCurrentUser();
      setUser(current);
      if (current) await refreshBetas(current.id);
      setIsBooting(false);
    })();
  }, [refreshBetas]);

  const handleAuthenticated = async (newUser: api.SessionUser) => {
    setUser(newUser);
    setCurrentTab('home');
    await refreshBetas(newUser.id);
  };

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión en La Beta?')) {
      await api.signOut();
      setUser(null);
      setBetas([]);
      setDbStats(null);
      setCurrentTab('home');
    }
  };

  // ─── Moderación (permiso validado por ROL, nunca por username) ───
  const handleModerate = async (betaId: string, flag: 'official' | 'hidden' | 'banned', value: boolean) => {
    if (!user || !isModeratorRole(user.role)) return;
    setBetas((prev) => prev.map((b) => (b.id === betaId ? { ...b, [flag]: value } : b))); // optimista
    try {
      await api.moderateBeta(user.id, betaId, flag, value);
      await refreshBetas(user.id);
    } catch (err) {
      await refreshBetas(user.id);
      alert(err instanceof Error ? err.message : 'No se pudo aplicar la acción de moderación.');
    }
  };

  const changeTab = (tab: Tab) => {
    if (tab === 'build') {
      // entrar a "Crear" desde el menú siempre arranca una beta nueva (sin enlace de versión)
      setBuildReplacesId(null);
      setBuildReplacesName(null);
      setBuildSession((s) => s + 1);
    } else {
      setBuildInitialWallId(null);
    }
    setCurrentTab(tab);
  };

  const navigateToBuild = (wallId: string | null) => {
    setBuildInitialWallId(wallId);
    setBuildReplacesId(null);
    setBuildReplacesName(null);
    setBuildSession((s) => s + 1);
    setCurrentTab('build');
  };

  // Crear una versión actualizada de una beta existente (histórico enlazado)
  const handleCreateUpdatedVersion = (beta: Beta) => {
    setSelectedBetaId(null);
    setBuildInitialWallId(beta.wallId);
    setBuildReplacesId(beta.id);
    setBuildReplacesName(beta.name);
    setBuildSession((s) => s + 1);
    setCurrentTab('build');
  };

  // ─── Publicar (async: la mascota espera el resultado real) ───
  const handlePublishBeta = async (input: api.NewBetaInput): Promise<void> => {
    if (!user) throw new Error('Sesión expirada. Vuelve a entrar.');
    // El rol decide si nace como Ruta Oficial
    await api.publishBeta(user.id, input, user.role);
    await refreshBetas(user.id);
    // Deja 1.4s para que la mascota celebre antes de ir al perfil
    setTimeout(() => {
      setBuildInitialWallId(null);
      setCurrentTab('dashboard');
    }, 1400);
  };

  const handleDeleteBeta = async (betaId: string) => {
    setBetas((prev) => prev.filter((b) => b.id !== betaId)); // optimista
    try {
      await api.deleteBeta(betaId);
    } catch {
      if (user) await refreshBetas(user.id);
      alert('No se pudo eliminar la beta.');
    }
  };

  const handleAddComment = async (betaId: string, text: string) => {
    if (!user) return;
    // Optimista: aparece al instante
    setBetas((prev) =>
      prev.map((b) =>
        b.id === betaId
          ? {
              ...b,
              comments: [...b.comments, { id: `tmp-${Date.now()}`, author: user.username, text, createdAt: 'Ahora' }]
            }
          : b
      )
    );
    try {
      await api.addComment(user.id, betaId, text);
    } catch {
      await refreshBetas(user.id);
      alert('No se pudo enviar el comentario.');
    }
  };

  const handleToggleRecommend = async (betaId: string) => {
    if (!user) return;
    const beta = betas.find((b) => b.id === betaId);
    if (!beta) return;
    const next = !beta.recommendedByMe;
    setBetas((prev) =>
      prev.map((b) =>
        b.id === betaId
          ? { ...b, recommendedByMe: next, recommendations: Math.max(0, b.recommendations + (next ? 1 : -1)) }
          : b
      )
    );
    try {
      await api.setRecommendation(user.id, betaId, next);
    } catch {
      await refreshBetas(user.id);
    }
  };

  // ─── Reportes de cambio de presas (consenso) ───
  const handleReport = async (betaId: string, reason: ReportReason) => {
    if (!user) return;
    // Optimista: marca mi reporte al instante
    setBetas((prev) =>
      prev.map((b) => {
        if (b.id !== betaId) return b;
        const holds = b.reportsHolds + (reason === 'holds_changed' && b.myReport !== 'holds_changed' ? 1 : 0);
        const removed = b.reportsRemoved + (reason === 'removed' && b.myReport !== 'removed' ? 1 : 0);
        return { ...b, myReport: reason, reportsHolds: holds, reportsRemoved: removed };
      })
    );
    try {
      await api.reportBeta(user.id, betaId, reason);
      // El trigger puede haber cambiado el estado: recargamos para reflejarlo
      await refreshBetas(user.id);
    } catch (err) {
      await refreshBetas(user.id);
      alert(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    }
  };

  const handleUnreport = async (betaId: string) => {
    if (!user) return;
    setBetas((prev) => prev.map((b) => (b.id === betaId ? { ...b, myReport: null } : b)));
    try {
      await api.unreportBeta(user.id, betaId);
      await refreshBetas(user.id);
    } catch {
      await refreshBetas(user.id);
    }
  };

  // ─── Ascensos ───
  const handleLogAscent = async (input: api.NewAscentInput) => {
    if (!user) return;
    try {
      await api.logAscent(user.id, input);
      await refreshBetas(user.id);
    } catch (err) {
      await refreshBetas(user.id);
      alert(err instanceof Error ? err.message : 'No se pudo registrar el ascenso.');
    }
  };

  const handleDeleteAscent = async (ascentId: string) => {
    if (!user) return;
    try {
      await api.deleteAscent(ascentId);
      await refreshBetas(user.id);
    } catch {
      await refreshBetas(user.id);
    }
  };

  // ─── Stats reales calculadas de los datos ───
  const myBetas = useMemo(() => (user ? betas.filter((b) => b.authorId === user.id) : []), [betas, user]);

  // Todos mis ascensos (sobre cualquier beta), con su betaId, para las stats
  const myAscents: AscentWithBeta[] = useMemo(
    () => betas.flatMap((b) => b.myAscents.map((a) => ({ ...a, betaId: b.id }))),
    [betas]
  );

  const activityData = useMemo(() => buildActivityMatrix(myBetas), [myBetas]);
  const isMod = user ? isModeratorRole(user.role) : false;

  const selectedBeta = betas.find((b) => b.id === selectedBetaId);

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (isBooting) {
    return <AppSkeleton />;
  }

  if (!user) {
    return <Onboarding onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans bg-tech-grid pb-28 md:pb-6 pt-20">
      <Navbar
        currentTab={currentTab}
        onChangeTab={changeTab}
        username={user.username}
        isModerator={isMod}
        onLogout={handleLogout}
      />

      <main className="max-w-[1200px] mx-auto px-5 md:px-8 py-4">
        {loadError && (
          <div className="mb-4 bg-red-950/40 border border-red-700/60 rounded-lg p-3 flex items-center justify-between gap-3">
            <p className="font-mono text-xs text-red-300">{loadError}</p>
            <button
              onClick={() => refreshBetas(user.id)}
              className="font-mono text-[10px] font-bold text-white bg-red-800/60 px-3 py-1.5 rounded btn-punch shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col gap-6"
        >
          {currentTab === 'home' && (
            <Home
              username={user.username}
              betas={betas}
              isLoading={isLoadingBetas}
              onNavigate={changeTab}
              onSelectBeta={setSelectedBetaId}
            />
          )}

          {currentTab === 'explore' && (
            <Explore
              walls={walls}
              betas={betas}
              onSelectBeta={setSelectedBetaId}
              onNavigateToBuild={navigateToBuild}
            />
          )}

          {currentTab === 'build' && (
            <Build
              key={buildSession}
              walls={walls}
              initialWallId={buildInitialWallId}
              replacesBetaId={buildReplacesId}
              replacesBetaName={buildReplacesName}
              onPublish={handlePublishBeta}
            />
          )}

          {currentTab === 'dashboard' && (
            <Dashboard
              dbStats={dbStats}
              myBetas={myBetas}
              myAscents={myAscents}
              username={user.username}
              userId={user.id}
              isModerator={isMod}
              activityData={activityData}
              onSelectBeta={setSelectedBetaId}
              onNavigateToBuild={() => navigateToBuild(null)}
              onDeleteBeta={handleDeleteBeta}
              onLogout={handleLogout}
            />
          )}

          {/* Panel exclusivo del moderador */}
          {currentTab === 'moderation' && isMod && (
            <Moderation
              betas={betas}
              walls={walls}
              onSelectBeta={setSelectedBetaId}
              onModerate={handleModerate}
              onDeleteBeta={handleDeleteBeta}
              onNavigateToBuild={() => navigateToBuild(null)}
            />
          )}
        </motion.div>

        {/* Créditos discretos */}
        <footer className="mt-10 pt-6 border-t border-outline-variant/30 flex justify-center">
          <span className="font-mono text-[9px] text-on-surface-variant/40 uppercase tracking-[0.2em] hover:text-on-surface-variant/70 transition-colors">
            Powered by Eugenia
          </span>
        </footer>
      </main>

      {selectedBeta && (
        <BetaDetail
          beta={selectedBeta}
          walls={walls}
          username={user.username}
          hasReplacement={!!selectedBeta.replacedById && betas.some((b) => b.id === selectedBeta.replacedById)}
          onClose={() => setSelectedBetaId(null)}
          onDelete={selectedBeta.authorId === user.id ? handleDeleteBeta : undefined}
          onAddComment={handleAddComment}
          onToggleRecommend={handleToggleRecommend}
          onReport={handleReport}
          onUnreport={handleUnreport}
          onOpenReplacement={(id) => setSelectedBetaId(id)}
          onCreateUpdatedVersion={handleCreateUpdatedVersion}
          onLogAscent={handleLogAscent}
          onDeleteAscent={handleDeleteAscent}
        />
      )}
    </div>
  );
}
