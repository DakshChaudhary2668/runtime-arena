import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import ModuleCard from '../components/progression/ModuleCard';
import { useAuth } from '../context/AuthContext';

export default function ModuleSelectPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        navigate('/');
      } else if (e.key === '1' || e.key === 'Enter') {
        navigate('/mission/flight-101/01');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSelectModule = (moduleId) => {
    const scenario = SCENARIOS.find(s => s.id === moduleId);

    // Route to Coming Soon page for space-rescue
    if (scenario?.status === 'coming-soon') {
      navigate(`/modules/${moduleId}`);
    } else {
      navigate(`/mission/${moduleId}/01`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 bg-black select-none">
      {/* Background Atmospherics - Gamified */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 cockpit-scene" />
        <div className="absolute inset-0 emergency-glow" />
        <div className="absolute inset-0 cockpit-grid opacity-15" />
        <div className="absolute inset-0 scanlines opacity-25" />
        <div className="absolute inset-0 vignette-cinematic" />
      </div>

      {/* Top Deck Navigation */}
      <header className="relative z-10 flex items-center justify-between pb-4 border-b border-teal-500/30 font-mono backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rt-control-gamified px-2.5 py-1 text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(20,184,166,0.5)]"
          >
            <span>◀</span>
            <span>TITLE SCREEN</span>
            <span className="text-[9px] text-teal-300 border border-teal-500/50 px-1 py-0.2 rounded-[2px]">[ESC]</span>
          </button>
          <span className="text-teal-500">●</span>
          <span className="text-xs font-normal text-teal-300 tracking-widest uppercase">
            OPERATIONAL MODULE DECK
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-white">PILOT: <span className="text-amber-400 font-bold">{user.name}</span></span>
              <button
                onClick={logout}
                className="rt-control-gamified px-2.5 py-1 text-[10px] text-white cursor-pointer transition-all hover:bg-red-900/20 hover:border-red-500"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="rt-control-gamified px-2.5 py-1 text-white cursor-pointer transition-all"
            >
              [ LOGIN ]
            </button>
          )}
        </div>
      </header>

      {/* Main Module Grid */}
      <main className="relative z-10 my-auto py-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Eyebrow & Display Title */}
          <div className="mb-8">
            <span className="font-mono text-[10px] tracking-[0.25em] text-teal-400 uppercase block mb-1">
              // ACTIVE SECTORS
            </span>
            <div className="inline-block">
              <h2 className="display-underline-mark-gamified text-5xl sm:text-6xl lg:text-[80px] font-bold tracking-normal text-transparent bg-gradient-to-r from-white via-teal-300 to-amber-300 bg-clip-text leading-[0.78]">
                SELECT CAMPAIGN MODULE
              </h2>
            </div>
          </div>

          {/* Grid of Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SCENARIOS.map((scenario) => (
              <ModuleCard
                key={scenario.id}
                scenario={scenario}
                onSelect={handleSelectModule}
                isLocked={scenario.status === 'locked'}
                isComingSoon={scenario.status === 'coming-soon'}
              />
            ))}
          </div>

          {/* Quick instructions */}
          <div className="mt-8 text-center font-mono text-[11px] text-teal-300/80 animate-pulse">
            ⌨️ PRESS [1] OR [ENTER] TO ACCESS FLIGHT 101 • PRESS [ESC] TO RETURN
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pt-4 border-t border-teal-500/30 font-mono text-[10px] text-teal-400/80 flex justify-between backdrop-blur-sm">
        <div>RUN TIME ARENA // SECTOR SELECTION</div>
        <div>AUTHORIZED AGENTS ONLY</div>
      </footer>
    </div>
  );
}
