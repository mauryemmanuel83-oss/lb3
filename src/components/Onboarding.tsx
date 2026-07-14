import React, { useState } from 'react';
import { Mascot } from './Mascot';
import { signUp, signIn, SessionUser, USERNAME_REGEX } from '../api';

interface OnboardingProps {
  onAuthenticated: (user: SessionUser) => void;
}

type Mode = 'login' | 'register';

export const Onboarding: React.FC<OnboardingProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanName = username.trim();
    if (!USERNAME_REGEX.test(cleanName)) {
      setError('El usuario debe tener 3-20 caracteres: letras, números o guion bajo');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = mode === 'register' ? await signUp(cleanName, password) : await signIn(cleanName, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center overflow-hidden antialiased relative bg-tech-grid py-10">
      {/* Top Caution Tape Detail */}
      <div className="fixed top-0 left-0 w-full h-2 bg-caution-tape z-50"></div>

      <main className="w-full max-w-md px-6 flex flex-col items-center justify-center space-y-8 z-10 relative">
        {/* Cabecera gráfica */}
        <div className="flex flex-col items-center justify-center space-y-5 w-full text-center">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 border-outline-variant relative bg-surface-container shadow-[4px_4px_0_0_#facc15] transition-transform hover:scale-105 duration-200 flex items-center justify-center pop-in">
            <Mascot state={loading ? 'publishing' : 'loading'} size={104} />
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 mix-blend-overlay"></div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-black text-4xl text-primary-container tracking-tighter uppercase">
              LA BETA
            </h1>
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
              El conocimiento de tu gym, compartido
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-surface-container p-6 rounded-lg border border-outline-variant flex flex-col space-y-5 relative shadow-[4px_4px_0_0_#000000]"
          id="onboarding-form"
        >
          {/* Remaches industriales */}
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>

          {/* Selector de modo */}
          <div className="flex bg-background border border-outline-variant rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 h-10 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                mode === 'register'
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:text-white'
              }`}
              id="btn-mode-register"
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 h-10 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                mode === 'login' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-white'
              }`}
              id="btn-mode-login"
            >
              Iniciar sesión
            </button>
          </div>

          {/* Usuario */}
          <div className="w-full space-y-2">
            <label className="font-mono text-xs text-on-surface-variant flex items-center space-x-2" htmlFor="username">
              <span className="material-symbols-outlined text-[16px] text-primary-container">account_box</span>
              <span>USUARIO</span>
            </label>
            <div className="relative flex items-center bg-background border-b-2 border-outline-variant focus-within:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-outline-variant ml-3 text-[18px]">alternate_email</span>
              <input
                autoComplete="username"
                className="w-full bg-transparent border-none text-on-surface font-sans h-12 px-3 placeholder:text-outline-variant/60 focus:ring-0 focus:outline-none text-base"
                id="username"
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="tu_nombre_de_escalador"
                type="text"
                value={username}
                maxLength={20}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="w-full space-y-2">
            <label className="font-mono text-xs text-on-surface-variant flex items-center space-x-2" htmlFor="password">
              <span className="material-symbols-outlined text-[16px] text-primary-container">key</span>
              <span>{mode === 'register' ? 'CREA TU CONTRASEÑA' : 'CONTRASEÑA'}</span>
            </label>
            <div className="relative flex items-center bg-background border-b-2 border-outline-variant focus-within:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-outline-variant ml-3 text-[18px]">lock</span>
              <input
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full bg-transparent border-none text-on-surface font-sans h-12 px-3 placeholder:text-outline-variant/60 focus:ring-0 focus:outline-none text-base"
                id="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 text-outline-variant hover:text-primary-container transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-mono flex items-start gap-1.5 leading-relaxed pop-in">
              <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">error</span>
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 font-display font-semibold text-sm rounded uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-200 shadow-[3px_3px_0_0_#4d4632] ${
              loading
                ? 'bg-surface-container-high text-on-surface-variant cursor-wait'
                : 'bg-primary-container text-on-primary hover:bg-yellow-400 active:scale-95 cursor-pointer'
            }`}
            id="btn-onboarding-submit"
          >
            <span>
              {loading
                ? mode === 'register'
                  ? 'Creando cuenta...'
                  : 'Entrando...'
                : mode === 'register'
                  ? 'Crear cuenta y escalar'
                  : 'Entrar'}
            </span>
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>

          <p className="font-mono text-[10px] text-on-surface-variant/60 text-center leading-relaxed">
            {mode === 'register'
              ? '¿Ya tienes cuenta? Toca "Iniciar sesión" arriba.'
              : '¿Primera vez? Toca "Crear cuenta" arriba.'}
          </p>
        </form>

        {/* Footer */}
        <div className="text-center w-full max-w-xs space-y-1">
          <p className="font-mono text-[10px] text-on-surface-variant/70 uppercase flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-primary-container">shield</span>
            Sin correos. Solo usuario y contraseña.
          </p>
        </div>
      </main>

      {/* Decoración inferior */}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-end pointer-events-none z-0 opacity-40">
        <div className="font-mono text-[9px] text-outline-variant flex flex-col">
          <span>SYS.STATUS: ONLINE</span>
          <span>NODE: PIRQA_LIMA</span>
        </div>
        <div className="font-mono text-[9px] text-outline-variant flex flex-col items-end">
          <span>// SUPABASE CLOUD</span>
          <span>[COMUNIDAD EN VIVO]</span>
        </div>
      </div>
    </div>
  );
};
