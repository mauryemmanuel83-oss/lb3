import React from 'react';

interface NavbarProps {
  currentTab: 'explore' | 'build' | 'dashboard';
  onChangeTab: (tab: 'explore' | 'build' | 'dashboard') => void;
  username: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  username,
  onLogout
}) => {
  return (
    <>
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-outline-variant h-14 flex items-center justify-between px-5 md:px-8">
        {/* Signal indicator / left branding element */}
        <button 
          onClick={() => onChangeTab('explore')}
          className="h-10 w-10 flex items-center justify-center hover:bg-surface-container-high transition-colors rounded-full text-primary-container"
          title="Ver Sectores"
          id="btn-nav-brand-signal"
        >
          <span className="material-symbols-outlined font-bold">signal_cellular_alt</span>
        </button>

        {/* Central Brand */}
        <h1 
          onClick={() => onChangeTab('explore')}
          className="font-display font-black text-2xl text-primary-container tracking-tighter cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all"
          id="nav-brand-title"
        >
          LA BETA
        </h1>

        {/* User profile capsule */}
        <div className="flex items-center gap-2">
          {onLogout ? (
            <button 
              onClick={onLogout}
              className="text-xs font-mono text-outline hover:text-primary-container transition-colors px-2 py-1 rounded border border-outline-variant hover:border-primary-container bg-surface-container-low hidden sm:block"
              title="Cerrar Sesión"
              id="btn-nav-logout"
            >
              Salir
            </button>
          ) : null}
          <div 
            onClick={() => onChangeTab('dashboard')}
            className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-container active:scale-95 transition-all"
            title={`Dashboard de ${username}`}
            id="nav-user-avatar-container"
          >
            <img 
              alt="Mascota Pixel Escalador" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1siR69oKnr8T4rX-NNtoEUt1HNX0HTpdsYuoeA27BH2lYWfm8HB1rvDOyLUJiqV79Mygqmtmi4EkxgJTgcYouZ_Dbm6CRYYmh5IFXd95S_H_NYoXv7Qw3btO44mG3ajy5agNjPpo3D9xFOX7UGNjhysUq1RQqFC5kxAivl4ZIc1tT9AP41aJ58pWs3PX5eu_1buhtqwsSfM-V1Vgh6bP1eUodIQ6k3FPiKBM8x1tqIhNZfwlLCli2o-kN81b4PuY3O5mNRif_nKRu"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Desktop Navigation Menu (Centered horizontally on mid/wide viewports) */}
        <nav className="hidden md:flex items-center space-x-12 absolute left-1/2 transform -translate-x-1/2">
          <button 
            onClick={() => onChangeTab('explore')}
            className={`font-display text-sm font-semibold tracking-wider transition-colors relative py-2 ${
              currentTab === 'explore' 
                ? 'text-primary-container after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary-container' 
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
            id="desktop-nav-explore"
          >
            EXPLORAR
          </button>
          <button 
            onClick={() => onChangeTab('build')}
            className={`font-display text-sm font-semibold tracking-wider transition-colors relative py-2 ${
              currentTab === 'build' 
                ? 'text-primary-container after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary-container' 
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
            id="desktop-nav-build"
          >
            CREAR BETA
          </button>
          <button 
            onClick={() => onChangeTab('dashboard')}
            className={`font-display text-sm font-semibold tracking-wider transition-colors relative py-2 ${
              currentTab === 'dashboard' 
                ? 'text-primary-container after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary-container' 
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
            id="desktop-nav-dashboard"
          >
            MI DASHBOARD
          </button>
        </nav>
      </header>

      {/* Bottom Navigation Bar (Mobile Only, Fixed Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 h-20 bg-surface border-t-2 border-outline-variant shadow-[0_-4px_0_0_rgba(0,0,0,1)] flex justify-around items-center px-4 pb-4 pt-2">
        <button 
          onClick={() => onChangeTab('explore')}
          className={`flex flex-col items-center justify-center h-12 w-16 transition-all duration-200 rounded-xl active:scale-90 ${
            currentTab === 'explore'
              ? 'bg-primary-container text-on-primary font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="mobile-nav-explore"
        >
          <span className="material-symbols-outlined text-[24px]">explore</span>
          <span className="font-mono text-[9px] mt-0.5">Explore</span>
        </button>

        <button 
          onClick={() => onChangeTab('build')}
          className={`flex flex-col items-center justify-center h-12 w-16 transition-all duration-200 rounded-xl active:scale-90 ${
            currentTab === 'build'
              ? 'bg-primary-container text-on-primary font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="mobile-nav-build"
        >
          <span className="material-symbols-outlined text-[24px]">add_box</span>
          <span className="font-mono text-[9px] mt-0.5">Build</span>
        </button>

        <button 
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center h-12 w-16 transition-all duration-200 rounded-xl active:scale-90 ${
            currentTab === 'dashboard'
              ? 'bg-primary-container text-on-primary font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          id="mobile-nav-dashboard"
        >
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="font-mono text-[9px] mt-0.5">Dashboard</span>
        </button>
      </nav>
    </>
  );
};
