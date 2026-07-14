import React from 'react';
import { Tab } from '../types';
import { Mascot } from './Mascot';

interface NavbarProps {
  currentTab: Tab;
  onChangeTab: (tab: Tab) => void;
  username: string;
  isModerator?: boolean;
  onLogout?: () => void;
}

const BASE_NAV: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'home', label: 'Inicio', icon: 'home' },
  { tab: 'explore', label: 'Explorar', icon: 'explore' },
  { tab: 'build', label: 'Crear', icon: 'add_box' },
  { tab: 'dashboard', label: 'Perfil', icon: 'person' }
];

const MOD_ITEM = { tab: 'moderation' as Tab, label: 'Moderar', icon: 'shield_person' };

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  username,
  isModerator = false,
  onLogout
}) => {
  // El tab de moderación solo existe para el rol moderator/admin
  const NAV_ITEMS = isModerator ? [...BASE_NAV, MOD_ITEM] : BASE_NAV;

  return (
    <>
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/95 backdrop-blur border-b border-outline-variant h-14 flex items-center justify-between px-5 md:px-8">
        {/* Marca con mascota */}
        <button
          onClick={() => onChangeTab('home')}
          className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
          title="Inicio"
          id="nav-brand"
        >
          <Mascot state="idle" size={30} />
          <h1 className="font-display font-black text-xl md:text-2xl text-primary-container tracking-tighter">
            LA BETA
          </h1>
        </button>

        {/* Navegación desktop centrada */}
        <nav className="hidden md:flex items-center space-x-10 absolute left-1/2 transform -translate-x-1/2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.tab}
              onClick={() => onChangeTab(item.tab)}
              className={`font-display text-sm font-semibold tracking-wider transition-colors relative py-2 uppercase ${
                currentTab === item.tab
                  ? 'text-primary-container after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary-container'
                  : 'text-on-surface-variant hover:text-primary-container'
              }`}
              id={`desktop-nav-${item.tab}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-mono text-outline hover:text-primary-container transition-colors px-2 py-1 rounded border border-outline-variant hover:border-primary-container bg-surface-container-low hidden sm:block btn-punch"
              title="Cerrar Sesión"
              id="btn-nav-logout"
            >
              Salir
            </button>
          )}
          <button
            onClick={() => onChangeTab('dashboard')}
            className="h-9 px-2.5 rounded-full border border-outline-variant bg-surface-container flex items-center gap-1.5 cursor-pointer hover:border-primary-container active:scale-95 transition-all"
            title={`Perfil de ${username}`}
            id="nav-user-chip"
          >
            <span className="material-symbols-outlined text-primary-container text-[18px]">
              {isModerator ? 'shield_person' : 'account_circle'}
            </span>
            <span className="font-mono text-[10px] text-on-surface max-w-[80px] truncate hidden sm:block">
              @{username}
            </span>
          </button>
        </div>
      </header>

      {/* Bottom Navigation (móvil) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 h-[76px] bg-surface/95 backdrop-blur border-t-2 border-outline-variant shadow-[0_-4px_0_0_rgba(0,0,0,1)] flex justify-around items-center px-2 pb-4 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.tab;
          const isCreate = item.tab === 'build';
          return (
            <button
              key={item.tab}
              onClick={() => onChangeTab(item.tab)}
              className={`flex flex-col items-center justify-center h-12 min-w-[64px] transition-all duration-200 rounded-xl active:scale-90 ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                  : isCreate
                    ? 'text-primary-container border border-primary-container/40 bg-primary-container/10'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              id={`mobile-nav-${item.tab}`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-mono text-[9px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
