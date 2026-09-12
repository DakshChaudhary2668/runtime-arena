import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getScenario } from '../data/scenarios';

export default function SpaceRescueComingSoon() {
  const navigate = useNavigate();
  const scenario = getScenario('space-rescue');
  const [revealStage, setRevealStage] = useState(0);
  const [showArchive, setShowArchive] = useState(false);

  // Cinematic reveal sequence
  useEffect(() => {
    const stages = [
      { delay: 0, stage: 0 },      // Initial black
      { delay: 500, stage: 1 },    // System link
      { delay: 1500, stage: 2 },   // Signal detected
      { delay: 2500, stage: 3 },   // Space Rescue title
      { delay: 3500, stage: 4 },   // Transmission found
      { delay: 4500, stage: 5 },   // Full reveal
    ];

    const timers = stages.map(({ delay, stage }) =>
      setTimeout(() => setRevealStage(stage), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'a' || e.key === 'A') {
        navigate('/modules');
      } else if (e.key === 'Enter') {
        navigate('/modules');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* ── DEEP SPACE BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        {/* Deep space starfield */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(2px 2px at 90% 60%, white, transparent),
              radial-gradient(1px 1px at 33% 80%, white, transparent),
              radial-gradient(2px 2px at 15% 90%, white, transparent),
              linear-gradient(180deg, #000408 0%, #000000 50%, #00020a 100%)
            `,
            backgroundSize: '200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%',
            backgroundPosition: '0% 0%',
            animation: 'starDrift 120s linear infinite'
          }}
        />

        {/* Distant planet/moon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: revealStage >= 3 ? 0.4 : 0 }}
          transition={{ duration: 2 }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #1a2332 0%, #0a0f1a 60%, transparent 100%)',
            filter: 'blur(1px)',
            transform: 'translate(30%, 30%)'
          }}
        />

        {/* System blue accent glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: revealStage >= 4 ? 0.15 : 0 }}
          transition={{ duration: 2 }}
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(100, 210, 255, 0.15) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 cockpit-grid opacity-10" />

        {/* Dark vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)'
          }}
        />
      </div>

      {/* ── TOP HUD ── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: revealStage >= 1 ? 1 : 0 }}
        className="relative z-10 flex items-center justify-between p-6 sm:p-8 border-b border-[#E2E2E2]/20 font-mono text-[10px]"
      >
        <div className="flex items-center gap-3">
          <span className="tracking-[0.25em] uppercase text-[#B8BAB9]">
            RUNTIME ARENA
          </span>
          <span className="text-[#E2E2E2]/40">/</span>
          <span className="tracking-[0.25em] uppercase text-white">
            FUTURE OPERATIONS
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#B8BAB9]">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
            <span className="text-[#FFD60A]">SIGNAL WEAK</span>
          </div>
          <span className="text-[#E2E2E2]">SECTOR {scenario.transmission.sector}</span>
        </div>
      </motion.header>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 sm:px-12 py-12 max-w-6xl">
        <AnimatePresence mode="wait">
          {/* Stage 1: System Link */}
          {revealStage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-xs text-[#B8BAB9] uppercase tracking-wider"
            >
              <div>SYSTEM LINK</div>
              <div className="mt-2">SEARCHING...</div>
            </motion.div>
          )}

          {/* Stage 2: Signal Detected */}
          {revealStage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-xs text-[#64D2FF] uppercase tracking-wider"
            >
              SIGNAL DETECTED
            </motion.div>
          )}

          {/* Stage 3: Title Reveal */}
          {revealStage === 3 && (
            <motion.h1
              key="stage3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-6xl sm:text-7xl md:text-[80px] font-normal tracking-normal leading-[0.78] text-white"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                textShadow: '0 0 30px rgba(100, 210, 255, 0.3)'
              }}
            >
              SPACE RESCUE
            </motion.h1>
          )}

          {/* Stage 4: Transmission Message */}
          {revealStage === 4 && (
            <motion.div
              key="stage4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h1
                className="text-6xl sm:text-7xl md:text-[80px] font-normal tracking-normal leading-[0.78] text-white"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  textShadow: '0 0 30px rgba(100, 210, 255, 0.3)'
                }}
              >
                SPACE RESCUE
              </h1>
              <div className="font-mono text-xs text-[#B8BAB9] uppercase tracking-wider">
                DISTRESS TRANSMISSION FOUND
              </div>
            </motion.div>
          )}

          {/* Stage 5: Full Content */}
          {revealStage >= 5 && (
            <motion.div
              key="stage5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 max-w-3xl"
            >
              {/* Title */}
              <div>
                <h1
                  className="text-6xl sm:text-7xl md:text-[80px] font-normal tracking-normal leading-[0.78] text-white mb-2"
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    textShadow: '0 0 30px rgba(100, 210, 255, 0.3)'
                  }}
                >
                  <div className="block">
                    <span className="display-underline-mark">SPACE</span>
                  </div>
                  <div className="block">
                    <span className="display-underline-mark">RESCUE</span>
                  </div>
                </h1>
                <div className="font-mono text-[11px] text-[#B8BAB9] uppercase tracking-[0.25em] mt-4">
                  ADVANCED OPERATIONS
                </div>
              </div>

              {/* Mission Brief */}
              <div className="space-y-4 font-mono text-sm text-[#E2E2E2] max-w-2xl">
                <p className="leading-relaxed">
                  {scenario.tagline}
                </p>
                <p className="text-[#B8BAB9] leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[10px] uppercase">
                <div className="space-y-1">
                  <div className="text-[#B8BAB9] tracking-wider">SIGNAL INTEGRITY</div>
                  <div className="text-[#64D2FF] text-base font-medium">{scenario.transmission.signal}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[#B8BAB9] tracking-wider">CREW STATUS</div>
                  <div className="text-white text-base font-medium">{scenario.transmission.crew}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[#B8BAB9] tracking-wider">OXYGEN RESERVES</div>
                  <div className="text-[#FFD60A] text-base font-medium">{scenario.transmission.oxygen}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[#B8BAB9] tracking-wider">DISTANCE</div>
                  <div className="text-white text-base font-medium">{scenario.transmission.distance}</div>
                </div>
              </div>

              {/* Mission Archive Preview */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="font-mono text-[11px] text-[#64D2FF] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>{showArchive ? '▼' : '▶'}</span>
                  <span>MISSION ARCHIVE</span>
                </button>

                {showArchive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 mt-4"
                  >
                    {scenario.missions.map((mission) => (
                      <div
                        key={mission.id}
                        className="border border-[#E2E2E2]/20 rounded-[2px] p-4 bg-[#444345]/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-mono text-[10px] text-[#B8BAB9] uppercase tracking-wider">
                            {mission.number} ───────────────
                          </div>
                        </div>
                        <div className="font-mono text-sm text-white mb-2 uppercase">
                          {mission.title}
                        </div>
                        <div className="space-y-1 font-mono text-[10px]">
                          <div className="text-[#B8BAB9]">
                            DATA STRUCTURE: <span className="text-[#E2E2E2]">{mission.topic}</span>
                          </div>
                          <div className="text-[#B8BAB9]">
                            CLEARANCE: <span className="text-[#FF453A]">RESTRICTED</span>
                          </div>
                          <div className="mt-2 text-[#B8BAB9] flex items-center gap-2">
                            <span className="inline-block">████████████░░░░</span>
                            <span className="text-[#64D2FF]">ENCRYPTED</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Lock State */}
              <div className="border border-[#FF453A]/30 rounded-[2px] p-6 bg-black/40">
                <div className="space-y-3 font-mono">
                  <div className="text-[10px] text-[#FF453A] uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A]" />
                    <span>ACCESS RESTRICTED</span>
                  </div>
                  <div className="text-sm text-[#E2E2E2]">
                    MISSION ARCHIVE ENCRYPTED
                  </div>
                  <div className="text-xs text-[#B8BAB9] leading-relaxed">
                    Space Rescue is not yet available in the current Arena build.
                  </div>
                  <div className="text-base text-white uppercase tracking-wider pt-2">
                    COMING SOON
                  </div>
                </div>
              </div>

              {/* Return Action */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                <button
                  onClick={() => navigate('/modules')}
                  className="px-8 py-3.5 text-xs font-normal tracking-wider uppercase
                           bg-[#444345]
                           border border-[#64D2FF]
                           rounded-[2px]
                           text-white
                           transition-colors duration-200
                           hover:bg-[#444345]/80"
                >
                  RETURN TO ARENA
                </button>
                <span className="font-mono text-[11px] text-[#B8BAB9] tracking-wider flex items-center gap-2">
                  <span>PRESS</span>
                  <kbd className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px]">ESC</kbd>
                  <span>TO RETURN</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM RIGHT TELEMETRY ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: revealStage >= 5 ? 1 : 0 }}
        className="absolute bottom-8 right-8 font-mono text-[10px] text-[#B8BAB9] space-y-2 hidden sm:block"
      >
        <div className="text-right uppercase tracking-wider">
          <div>TRANSMISSION {scenario.transmission.id}</div>
          <div className="text-[#64D2FF]">SIGNAL {scenario.transmission.signal}</div>
        </div>
      </motion.div>

      {/* AI Director Dormant State */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: revealStage >= 5 ? 1 : 0 }}
        className="absolute top-20 right-8 font-mono text-[10px] text-[#B8BAB9] space-y-2 hidden lg:block max-w-xs"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8BAB9]" />
          <span className="uppercase tracking-wider">AI DIRECTOR</span>
          <span className="text-[#E2E2E2]">STANDBY</span>
        </div>
        <div className="text-[#B8BAB9] text-[9px] leading-relaxed">
          Mission data incomplete. Intervention protocol unavailable.
        </div>
      </motion.div>
    </div>
  );
}
