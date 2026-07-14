/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Navbar } from './components/Navbar';
import { Explore } from './components/Explore';
import { Build } from './components/Build';
import { Dashboard } from './components/Dashboard';
import { BetaDetail } from './components/BetaDetail';
import { Beta, Sector, ClimberStats, ActivityMatrixDay } from './types';
import { INITIAL_SECTORS, INITIAL_BETAS, INITIAL_STATS, generateActivityMatrix } from './data';

export default function App() {
  // Onboarding username state
  const [username, setUsername] = useState<string | null>(null);
  
  // Navigation active tab: 'explore', 'build', 'dashboard'
  const [currentTab, setCurrentTab] = useState<'explore' | 'build' | 'dashboard'>('explore');
  
  // App data states
  const [betas, setBetas] = useState<Beta[]>([]);
  const [sectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [stats, setStats] = useState<ClimberStats>(INITIAL_STATS);
  const [activityData, setActivityData] = useState<ActivityMatrixDay[]>([]);
  
  // Interaction/Detail states
  const [selectedBetaId, setSelectedBetaId] = useState<string | null>(null);
  const [buildInitialSectorId, setBuildInitialSectorId] = useState<string | null>(null);

  // Initialize and load persistent data from local storage
  useEffect(() => {
    // 1. Username setup
    const savedUser = localStorage.getItem('la_beta_username');
    if (savedUser) {
      setUsername(savedUser);
    }

    // 2. Betas list
    const savedBetas = localStorage.getItem('la_beta_betas');
    if (savedBetas) {
      try {
        setBetas(JSON.parse(savedBetas));
      } catch (e) {
        setBetas(INITIAL_BETAS);
      }
    } else {
      setBetas(INITIAL_BETAS);
      localStorage.setItem('la_beta_betas', JSON.stringify(INITIAL_BETAS));
    }

    // 3. Climber statistics
    const savedStats = localStorage.getItem('la_beta_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        setStats(INITIAL_STATS);
      }
    } else {
      setStats(INITIAL_STATS);
      localStorage.setItem('la_beta_stats', JSON.stringify(INITIAL_STATS));
    }

    // 4. Consistency heatmap matrix data
    const savedActivity = localStorage.getItem('la_beta_activity');
    if (savedActivity) {
      try {
        setActivityData(JSON.parse(savedActivity));
      } catch (e) {
        const generated = generateActivityMatrix();
        setActivityData(generated);
        localStorage.setItem('la_beta_activity', JSON.stringify(generated));
      }
    } else {
      const generated = generateActivityMatrix();
      setActivityData(generated);
      localStorage.setItem('la_beta_activity', JSON.stringify(generated));
    }
  }, []);

  // Set new username during onboarding
  const handleJoin = (newName: string) => {
    setUsername(newName);
    localStorage.setItem('la_beta_username', newName);
    
    // Switch to explore page
    setCurrentTab('explore');
  };

  // Sign out / Reset credentials
  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión en La Beta? Tus datos locales se conservarán en el navegador.')) {
      setUsername(null);
      localStorage.removeItem('la_beta_username');
    }
  };

  // Create and add a new climbing route (Beta)
  const handlePublishBeta = (newBetaData: Omit<Beta, 'id' | 'createdAt' | 'author'>) => {
    const newBeta: Beta = {
      ...newBetaData,
      id: `beta-${Date.now()}`,
      createdAt: 'Hoy',
      author: username || 'MascotClimber'
    };

    const updatedBetas = [newBeta, ...betas];
    setBetas(updatedBetas);
    localStorage.setItem('la_beta_betas', JSON.stringify(updatedBetas));

    // Update Statistics (Live score metrics update)
    const scoreGain = 150; // default publishing rewards points
    const updatedStats: ClimberStats = {
      ...stats,
      globalBetaScore: stats.globalBetaScore + scoreGain,
      sendsThisWeek: newBeta.activeProject ? stats.sendsThisWeek : stats.sendsThisWeek + 1,
      activeProjects: newBeta.activeProject ? stats.activeProjects + 1 : stats.activeProjects
    };
    setStats(updatedStats);
    localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));

    // Append some activity points to matrix
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedActivity = activityData.map(day => {
      if (day.date === todayStr) {
        return { ...day, count: Math.min(day.count + 1, 4) };
      }
      return day;
    });
    setActivityData(updatedActivity);
    localStorage.setItem('la_beta_activity', JSON.stringify(updatedActivity));

    // Reset initial sector triggers
    setBuildInitialSectorId(null);
    
    // Route to Dashboard to review published routes
    setCurrentTab('dashboard');

    // Automatically trigger detail drawer preview of the newly authored route!
    setSelectedBetaId(newBeta.id);
  };

  // Delete a route (Beta)
  const handleDeleteBeta = (betaId: string) => {
    const updatedBetas = betas.filter(b => b.id !== betaId);
    setBetas(updatedBetas);
    localStorage.setItem('la_beta_betas', JSON.stringify(updatedBetas));

    // Subtract points if deleting custom route
    const deleted = betas.find(b => b.id === betaId);
    if (deleted && deleted.author === username) {
      const updatedStats = {
        ...stats,
        globalBetaScore: Math.max(stats.globalBetaScore - 150, 0)
      };
      setStats(updatedStats);
      localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));
    }
  };

  // Toggle active project status
  const handleToggleProject = (betaId: string) => {
    const updatedBetas = betas.map(b => {
      if (b.id === betaId) {
        return { ...b, activeProject: !b.activeProject };
      }
      return b;
    });
    setBetas(updatedBetas);
    localStorage.setItem('la_beta_betas', JSON.stringify(updatedBetas));

    // Adjust scores
    const modified = betas.find(b => b.id === betaId);
    if (modified) {
      const becomingSend = modified.activeProject; // transitioning from true (project) to false (send)
      const scoreAdjust = becomingSend ? 250 : -250; // 250 bonus points for sending a project
      
      const updatedStats = {
        ...stats,
        globalBetaScore: Math.max(stats.globalBetaScore + scoreAdjust, 0),
        sendsThisWeek: becomingSend ? stats.sendsThisWeek + 1 : Math.max(stats.sendsThisWeek - 1, 0)
      };
      setStats(updatedStats);
      localStorage.setItem('la_beta_stats', JSON.stringify(updatedStats));
    }
  };

  // Find selected beta for detailed overlay
  const selectedBeta = betas.find(b => b.id === selectedBetaId);

  // If user is not logged in / entered nickname, show Onboarding Screen
  if (!username) {
    return <Onboarding onJoin={handleJoin} />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans bg-tech-grid pb-24 md:pb-6 pt-20">
      
      {/* Navigation Bars */}
      <Navbar 
        currentTab={currentTab} 
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          // Reset preset sector if changing manually
          if (tab !== 'build') setBuildInitialSectorId(null);
        }} 
        username={username}
        onLogout={handleLogout}
      />

      {/* Main Tab Screen Area */}
      <main className="max-w-[1200px] mx-auto px-5 md:px-8 py-4 flex flex-col gap-6">
        
        {currentTab === 'explore' && (
          <Explore 
            sectors={sectors} 
            betas={betas}
            onSelectBeta={(betaId) => setSelectedBetaId(betaId)}
            onNavigateToBuild={(sectorId) => {
              setBuildInitialSectorId(sectorId);
              setCurrentTab('build');
            }}
          />
        )}

        {currentTab === 'build' && (
          <Build 
            sectors={sectors} 
            initialSectorId={buildInitialSectorId}
            onPublish={handlePublishBeta}
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            betas={betas}
            activityData={activityData}
            onSelectBeta={(betaId) => setSelectedBetaId(betaId)}
            onNavigateToBuild={() => {
              setBuildInitialSectorId(null);
              setCurrentTab('build');
            }}
            onDeleteBeta={handleDeleteBeta}
            onToggleProject={handleToggleProject}
          />
        )}

      </main>

      {/* Interactive Detail Drawer Modal Overlay */}
      {selectedBeta && (
        <BetaDetail 
          beta={selectedBeta}
          sectors={sectors}
          onClose={() => setSelectedBetaId(null)}
          onDelete={selectedBeta.author === username ? handleDeleteBeta : undefined}
          onToggleProject={handleToggleProject}
        />
      )}

    </div>
  );
}

