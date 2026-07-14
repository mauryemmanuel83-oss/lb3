import React, { useState } from 'react';

interface OnboardingProps {
  onJoin: (username: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onJoin }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = usernameInput.trim();
    if (!cleanName) {
      setError('Por favor elige un nombre de usuario válido');
      return;
    }
    if (cleanName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    onJoin(cleanName);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center overflow-hidden antialiased relative bg-tech-grid">
      {/* Top Caution Tape Detail */}
      <div className="fixed top-0 left-0 w-full h-2 bg-caution-tape z-50"></div>

      <main className="w-full max-w-md px-6 flex flex-col items-center justify-center space-y-12 z-10 relative">
        {/* Graphic Header Area */}
        <div className="flex flex-col items-center justify-center space-y-6 w-full text-center">
          {/* Mascot Container */}
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl overflow-hidden border-2 border-outline-variant relative bg-surface-container shadow-[4px_4px_0_0_#facc15] transition-transform hover:scale-105 duration-200">
            <img 
              alt="La Beta Mascot - Pixel Climber" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqbcSTEaJUsiUvEDZ9uPUnqxBMZbA3LmZ1Hg6kp6jFFQAYwkvijjeQRUrnMz3U-_L4c6bzidEsxbndkDkAcAoSxuYoEnsL2yzUu9vv12fcs4l8WrYnl_YpwRQwr_k6Smv3ZPQ_lfqBr-alu0n13DyFYYZwRY5ihjS6y-oIgiQ7Zva6Yt7AiiwMourCS1r0DGS6kEuwlHeZ5ligs37tb1HjgDbZBzq48-boF73Fvq-Vklz-LD1LJceHwTRTwNjsqzeNHa9w_JYTEN02"
              referrerPolicy="no-referrer"
            />
            {/* Scanline overlay effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 mix-blend-overlay"></div>
          </div>

          {/* Brand Typography */}
          <div className="space-y-2">
            <h1 className="font-display font-black text-4xl text-primary-container tracking-tighter uppercase relative inline-block">
              LA BETA
              <span className="absolute -top-1 -right-8 font-mono text-[9px] text-outline-variant bg-surface-container-high px-1 rounded-sm border border-outline">v1.2</span>
            </h1>
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
              Community Climbing Intelligence
            </p>
          </div>
        </div>

        {/* Interactive Form Area */}
        <form 
          onSubmit={handleSubmit}
          className="w-full bg-surface-container p-6 rounded-lg border border-outline-variant flex flex-col space-y-5 relative shadow-[4px_4px_0_0_#000000]"
          id="onboarding-form"
        >
          {/* Industrial corner rivets */}
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-outline-variant rounded-full"></div>

          <div className="w-full space-y-2">
            <label className="font-mono text-xs text-on-surface-variant flex items-center space-x-2" htmlFor="username">
              <span className="material-symbols-outlined text-[16px] text-primary-container">account_box</span>
              <span>USERNAME_INPUT</span>
            </label>
            
            <div className="relative flex items-center bg-background border-b-2 border-outline-variant focus-within:border-primary-container transition-all duration-200">
              <span className="material-symbols-outlined text-outline-variant ml-3 text-[18px]">alternate_email</span>
              <input 
                autocomplete="off" 
                className="w-full bg-transparent border-none text-on-surface font-sans h-12 px-3 placeholder:text-outline-variant/60 focus:ring-0 focus:outline-none text-base" 
                id="username" 
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError('');
                }}
                placeholder="Elige tu nombre de usuario" 
                type="text"
                value={usernameInput}
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 font-mono pt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full h-12 bg-primary-container text-on-primary font-display font-semibold text-sm rounded uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-yellow-400 active:scale-95 cursor-pointer transition-all duration-200 shadow-[3px_3px_0_0_#4d4632]"
            id="btn-onboarding-submit"
          >
            <span>Empezar a escalar</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>

        {/* Footer Disclaimer */}
        <div className="text-center w-full max-w-xs space-y-1">
          <p className="font-mono text-[10px] text-on-surface-variant/70 uppercase flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-primary-container">info</span>
            Sin correos. Sin contraseñas. Solo escalada.
          </p>
        </div>
      </main>

      {/* Bottom Tech Decor */}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-end pointer-events-none z-0 opacity-40">
        <div className="font-mono text-[9px] text-outline-variant flex flex-col">
          <span>SYS.STATUS: ONLINE</span>
          <span>NODE: PIRQA_LIMA</span>
        </div>
        <div className="font-mono text-[9px] text-outline-variant flex flex-col items-end">
          <span>// NO SECRETS REQUIRED</span>
          <span>[LOCAL_STORAGE DATA STREAM]</span>
        </div>
      </div>
    </div>
  );
};
