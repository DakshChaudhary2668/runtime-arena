import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function EntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle ENTER key to enter arena
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        navigate('/modules');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-8 bg-black select-none overflow-hidden">
      {/* ── CINEMATIC COCKPIT VIDEO BACKGROUND WITH LEFT-TO-RIGHT GRADIENT OVERLAY ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Full-bleed background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.9) contrast(1.1)' }}
        >
          <source src="/videos/entry-background.mp4" type="video/mp4" />
        </video>

        {/* Left-to-right gradient overlay: rgba(0,0,0,0.9) on left to rgba(0,0,0,0.4) on right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.75) 40%, rgba(0, 0, 0, 0.4) 100%)',
          }}
        />

        {/* Tactical grid & scanlines */}
        <div className="absolute inset-0 cockpit-grid opacity-15" />
        <div className="absolute inset-0 scanlines opacity-25" />
        <div className="absolute inset-0 vignette" />
      </div>

      {/* ── TOP BOOT READOUT ── */}
      <header className="relative z-10 flex items-center justify-between font-mono text-[10px] sm:text-xs text-[#B8BAB9] border-b border-[#E2E2E2] pb-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#64D2FF] inline-block animate-pulse" />
          <span className="tracking-[0.25em] uppercase text-white font-normal">
            SYSTEM BOOT // ARENA KERNEL v2.6
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[#ef4444] animate-pulse">CRITICAL</span>
          {user ? (
            <span className="text-white">PILOT: {user.name.toUpperCase()}</span>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="rt-control px-2.5 py-1 text-white cursor-pointer tracking-wider transition-colors"
            >
              [ PILOT LOGIN ]
            </button>
          )}
        </div>
      </header>

      {/* ── HERO TITLE & HOOK (AWWWARDS EDITORIAL REFACTOR) ── */}
      <main className="relative z-10 flex flex-col justify-center flex-1 max-w-5xl py-12">
        {/* Massive Wide Editorial Display Title */}
        <h1
          className="text-5xl sm:text-7xl lg:text-[96px] font-black tracking-[-0.03em] leading-[0.88] mb-6 select-none text-white max-w-5xl uppercase"
          style={{
            fontFamily: "'Cabinet Grotesk', 'Outfit', system-ui, sans-serif",
            textShadow: '0 0 40px rgba(100, 210, 255, 0.25)',
          }}
        >
          RUNTIME{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2E2E2] to-[#64D2FF]">
            ARENA
          </span>
        </h1>

        {/* Tagline & Mission Briefing */}
        <div className="space-y-4 mb-8">
          <p
            className="text-base sm:text-xl font-medium tracking-[0.18em] text-white/95 uppercase"
            style={{ fontFamily: "'Outfit', 'Geist', sans-serif" }}
          >
            CODE WITH PURPOSE <span className="text-[#64D2FF] mx-1">•</span> LEARN WITH ADVENTURE
          </p>

          <p
            className="text-sm sm:text-base text-[#B8BAB9] max-w-2xl leading-relaxed font-light"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Your skills are the only thing between the system and failure. Every problem is wrapped in a live
            mission emergency where real code controls survival.
          </p>

          {/* Tactical Telemetry Ribbon */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 font-mono text-[11px] tracking-widest text-[#E2E2E2]/80 uppercase">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64D2FF] shadow-[0_0_8px_#64D2FF]" />
              <span>4 SIMULATION MODULES</span>
            </div>
            <div className="hidden sm:block w-px h-3 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" />
              <span>12+ SCENARIO MISSIONS</span>
            </div>
            <div className="hidden sm:block w-px h-3 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shadow-[0_0_8px_#FFD60A]" />
              <span>REAL RUNTIME COMPILER</span>
            </div>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
          <button
            onClick={() => navigate('/modules')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1f2e] border border-[#64D2FF] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 hover:bg-[#64D2FF] hover:text-black hover:shadow-[0_0_30px_rgba(100,210,255,0.45)] active:scale-[0.98] cursor-pointer"
            style={{ fontFamily: "'Outfit', 'Geist', sans-serif" }}
          >
            <span>ENTER THE ARENA</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-current rounded-[2px] transition-transform duration-200 group-hover:translate-x-0.5">
              [ENTER]
            </span>
          </button>

          <span className="font-mono text-[11px] text-[#8b9bb4] tracking-wider uppercase flex items-center gap-2">
            <span>PRESS</span>
            <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px]">ENTER</kbd>
            <span>TO COMMENCE OPERATION</span>
          </span>
        </div>
      </main>

      {/* ── FOOTER READOUT ── */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E2E2] font-mono text-[10px] text-[#B8BAB9]">
        <div className="flex items-center gap-4">
          <span>MODULES: 04 LOADED</span>
          <span>•</span>
          <span>DIRECTOR: GEMMA AI ENGINE</span>
          <span>•</span>
          <span>EXECUTION: LOCAL SANDBOX</span>
        </div>
        <div className="tracking-widest">
          RUN TIME ARENA // MISSION CONTROL
        </div>
      </footer>
    </div>
  );
}
