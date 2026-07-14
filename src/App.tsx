/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Explore } from './components/Explore';
import { Build } from './components/Build';
import { Dashboard } from './components/Dashboard';
import { BetaDetail } from './components/BetaDetail';
import { Beta, Wall, ClimberStats, ActivityMatrixDay, Tab, Comment } from './types';
import { INITIAL_WALLS, INITIAL_BETAS, INITIAL_STATS, generateActivityMatrix } from './data';

const BETAS_KEY = 'la_beta_betas_v2';
const LEGACY_BETAS_KEY = 'la_beta_betas';

// Migra betas del esquema antiguo (sectores ficticios) al nuevo (muros reales)
const migrateLegacyBetas = (raw: string): Beta[] | null => {
  try {
    const old = JSON.parse(raw);
    if (!Array.isArray(old)) return null;
    const sectorToWall: Record<string, string> = {
      cueva: 'zona-1-adentro',
      placa: 'zona-3-afuera',
      comp: 'zona-1-afuera'
    };
    return old.map((b: any) => ({
      ...b,
      wallId: b.wallId || sectorToWall[b.sectorId] || 'zona-1-adentro',
      strokes: b.strokes || [],
      texts: b.texts || [],
      comments: b.comments || [],
      recommendations: b.recommendations ?? 0
    }));
  } catch {
    return null;
  }
};

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

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  const [betas, setBetas] = useState<Beta[]>([]);
  const [walls] = useState<Wall[]>(INITIAL_WALLS);
  const [stats, setStats] = useState<ClimberStats>(INITIAL_STATS);
  const [activityData, setActivityData] = useState<ActivityMatrixDay[]>([]);

  const [selectedBetaId, setSelectedBetaId] = useState<string | null>(null);
  const [buildInitialWallId, setBuildInitialWallId] = useState<string | null>(null);
  // Fuerza remount del wizard de creación al re-entrar
  const [buildSession, setBuildSession] = useState(0);

  const persistBetas = (updated: Beta[]) => {
    setBetas(updated);
    try {
      localStorage.setItem(BETAS_KEY, JSON.stringify(updated));
    } catch {
      // Cuota llena: quita la beta más antigua con foto pesada y reintenta
      const trimmed = updated.slice(0, Math.max(1, updated.length - 1));
      try {
        localStorage.setItem(BETAS_KEY, JSON.stringify(trimmed));
      } catch {
        /* sin espacio: seguimos solo en memoria */
      }
    }
  };

  // Carga inicial de datos persistentes
  useEffect(() => {
    const savedUser = localStorage.getItem('la_beta_username');
    if (savedUser) setUsername(savedUser);

    const savedBetas = localStorage.getItem(BETAS_KEY);
    if (savedBetas) {
      try {
        setBetas(JSON.parse(savedBetas));
      } catch {
        setBetas(INITIAL_BETAS);
      }
    } else {
      const legacy = localStorage.getItem(LEGACY_BETAS_KEY);
      const migrated = legacy ? migrateLegacyBetas(legacy) : null;
      const initial = migrated && migrated.length > 0 ? migrated : INITIAL_BETAS;
      setBetas(initial);
      try {
        localStorage.setItem(BETAS_KEY, JSON.stringify(initial));
      } catch {
        /* noop */
      }
    }

    const savedStats = localStorage.getItem('la_beta_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch {
        setStats(INITIAL_STATS);
      }
    } else {
      setStats(INITIAL_STATS);
      localStorage.setItem('la_beta_stats', JSON.stringify(INITIAL_STATS));
    }

    const savedActivity = localStorage.getItem('la_beta_activity');
    if (savedActivity) {
      try {
        setActivityData(JSON.parse(savedActivity));
      } catch {
        const generated = generateActivityMatrix();
        setActivityData(generated);
        localStorage.setItem('la_beta_activity', JSON.stringify(generated));
      }
    } else {
      const generated = generateActivityMatrix();
      setActivityData(generated);
      localStorage.setItem('la_beta_activity', JSON.stringify(generated));
    }

    // Pequeño beat para el skeleton (percepción de app real)
    const t = setTimeout(() => setIsBooting(false), 650);
    return () => clearTimeout(t);
  }, []);

  const handleJoin = (newName: string) => {
    setUsername(newName);
    localStorage.setItem('la_beta_username', newName);
    setCurrentTab('home');
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión en La Beta? Tus datos locales se conservarán en el navegador.')) {
      setUsername(null);
      localStorage.removeItem('la_beta_username');
    }
  };

  const changeTab = (tab: Tab) => {
    if (tab === 'build') {
      setBuildSession((s) => s + 1);
    } else {
      setBuildInitialWallId(null);
    }
    setCurrentTab(tab);
  };

  const navigateToBuild = (wallId: string | null) => {
    setBuildInitialWallId(wallId);
    setBuildSession((s) => s + 1);
    setCurrentTab('build');
  };

  // ─── Publicar una nueva Beta ───
  const handlePublishBeta = (newBetaData: Omit<Beta, 'id' | 'createdAt' | 'author' | 'comments' | 'recommendations'>) => {
    const newBeta: Beta = {
      ...newBetaData,
      id: `beta-${Date.now()}`,
      createdAt: 'Hoy',
      author: username || 'anon',
      comments: [],
      recommendations: 0
    };

    persistBetas([newBeta, ...betas]);

    const scoreGain = 150;
    const updatedStats: ClimberStats = {
      ...stats,
      globalBetaScore: stats.globalBetaScore + scoreGain,
      sendsThisWeek: newBeta.activeProject ? stats.sendsThisWeek : stats.sendsThisWeek + 1,
      activeProjects: newBeta.activeProject ? stats.activeProjects + 1 : stats.activeProjects
    };
    setStats(updatedStats);
    localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedActivity = activityData.map((day) =>
      day.date === todayStr ? { ...day, count: Math.min(day.count + 1, 4) } : day
    );
    setActivityData(updatedActivity);
    localStorage.setItem('la_beta_activity', JSON.stringify(updatedActivity));

    setBuildInitialWallId(null);
    setCurrentTab('dashboard');
    setSelectedBetaId(newBeta.id);
  };

  const handleDeleteBeta = (betaId: string) => {
    const deleted = betas.find((b) => b.id === betaId);
    persistBetas(betas.filter((b) => b.id !== betaId));

    if (deleted && deleted.author === username) {
      const updatedStats = {
        ...stats,
        globalBetaScore: Math.max(stats.globalBetaScore - 150, 0)
      };
      setStats(updatedStats);
      localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));
    }
  };

  const handleToggleProject = (betaId: string) => {
    const modified = betas.find((b) => b.id === betaId);
    persistBetas(betas.map((b) => (b.id === betaId ? { ...b, activeProject: !b.activeProject } : b)));

    if (modified) {
      const becomingSend = modified.activeProject;
      const scoreAdjust = becomingSend ? 250 : -250;
      const updatedStats = {
        ...stats,
        globalBetaScore: Math.max(stats.globalBetaScore + scoreAdjust, 0),
        sendsThisWeek: becomingSend ? stats.sendsThisWeek + 1 : Math.max(stats.sendsThisWeek - 1, 0)
      };
      setStats(updatedStats);
      localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));
    }
  };

  // ─── Comentarios y recomendaciones ───
  const handleAddComment = (betaId: string, text: string) => {
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: username || 'anon',
      text,
      createdAt: 'Ahora'
    };
    persistBetas(betas.map((b) => (b.id === betaId ? { ...b, comments: [...b.comments, comment] } : b)));
  };

  const handleToggleRecommend = (betaId: string) => {
    persistBetas(
      betas.map((b) => {
        if (b.id !== betaId) return b;
        const recommendedByMe = !b.recommendedByMe;
        return {
          ...b,
          recommendedByMe,
          recommendations: Math.max(0, b.recommendations + (recommendedByMe ? 1 : -1))
        };
      })
    );
  };

  const selectedBeta = betas.find((b) => b.id === selectedBetaId);

  if (!username) {
    return <Onboarding onJoin={handleJoin} />;
  }

  if (isBooting) {
    return <AppSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans bg-tech-grid pb-28 md:pb-6 pt-20">
      <Navbar currentTab={currentTab} onChangeTab={changeTab} username={username} onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto px-5 md:px-8 py-4">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col gap-6"
        >
            {currentTab === 'home' && (
              <Home
                username={username}
                betas={betas}
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
                onPublish={handlePublishBeta}
              />
            )}

          {currentTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              betas={betas}
              username={username}
              activityData={activityData}
              onSelectBeta={setSelectedBetaId}
              onNavigateToBuild={() => navigateToBuild(null)}
              onDeleteBeta={handleDeleteBeta}
              onToggleProject={handleToggleProject}
            />
          )}
        </motion.div>
      </main>

      {selectedBeta && (
        <BetaDetail
          beta={selectedBeta}
          walls={walls}
          username={username}
          onClose={() => setSelectedBetaId(null)}
          onDelete={selectedBeta.author === username ? handleDeleteBeta : undefined}
          onToggleProject={handleToggleProject}
          onAddComment={handleAddComment}
          onToggleRecommend={handleToggleRecommend}
        />
      )}
    </div>
  );
}
