import React from 'react';
import Button from '../common/Button';

export default function ModuleCard({
  scenario,
  onSelect,
  isLocked = false,
  isCompleted = false,
  isComingSoon = false,
}) {
  const isFlight = scenario.id === 'flight-101';
  const isSpaceRescue = scenario.id === 'space-rescue';

  return (
    <div
      className={`group relative flex flex-col justify-between p-6 bg-gradient-to-b from-[#1a1f2e]/60 to-[#08111d]/90 border ${
        isFlight
          ? isCompleted
            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400'
            : 'border-teal-500/60 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:border-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]'
          : isSpaceRescue
          ? 'border-[#64D2FF]/40 shadow-[0_0_15px_rgba(100,210,255,0.15)] hover:border-[#64D2FF]/60 hover:shadow-[0_0_25px_rgba(100,210,255,0.25)]'
          : isLocked
          ? 'border-neutral-800 opacity-75'
          : isCompleted
          ? 'border-emerald-500/50 hover:border-emerald-400'
          : 'border-teal-500/50 hover:border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
      } transition-all duration-300 rounded-[12px] overflow-hidden backdrop-blur-md`}
    >
      {/* Flight Module Glow Accent */}
      {isFlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
      )}

      {/* Space Rescue Module Glow Accent */}
      {isSpaceRescue && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#64D2FF]/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
      )}

      {/* Top Header & Track Badges */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-teal-400 uppercase font-bold">
            // {scenario.track} TRACK
          </span>
          <span
            className={`font-mono text-[9px] px-2 py-0.5 rounded-[4px] tracking-wider uppercase font-bold ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isLocked
                ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                : isFlight
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                : isComingSoon
                ? 'bg-[#64D2FF]/20 text-[#64D2FF] border border-[#64D2FF]/40'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
            }`}
          >
            {isCompleted
              ? '★ COMPLETE'
              : isFlight
              ? '🚨 CRITICAL'
              : (scenario.badge || (isLocked ? 'LOCKED' : 'AVAILABLE'))}
          </span>
        </div>

        {/* Module Title */}
        <h3 className={`font-sans text-xl sm:text-2xl font-bold tracking-wide text-white mb-1 transition-colors ${
          isSpaceRescue ? 'group-hover:text-[#64D2FF]' : 'group-hover:text-teal-200'
        }`}>
          {scenario.title}
        </h3>

        {/* Level / Mission Count */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-400 mb-4">
          <span className="text-amber-400 font-medium">{scenario.level}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-teal-300">{scenario.totalMissions} MISSIONS</span>
        </div>

        {/* Cinematic Tagline */}
        <p className="font-mono text-xs text-neutral-200 mb-3 leading-relaxed tracking-wide italic">
          "{scenario.tagline}"
        </p>

        {/* Description */}
        <p className="font-mono text-[11px] text-neutral-400 leading-relaxed mb-6 line-clamp-3">
          {scenario.description}
        </p>
      </div>

      {/* Footer Actions / Unlock State */}
      <div className="pt-4 border-t border-white/10">
        {isLocked ? (
          <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500">
            <span className="text-neutral-400 font-medium tracking-wider">🔒 CLASSIFIED</span>
            <span>{scenario.lockReason || 'AVAILABLE SOON'}</span>
          </div>
        ) : isComingSoon ? (
          <button
            onClick={() => onSelect(scenario.id)}
            className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase rounded-lg tracking-wider transition-all duration-200
                     bg-gradient-to-r from-[#1a1f2e] to-[#0a0f1a] hover:from-[#0a0f1a] hover:to-[#1a1f2e]
                     text-[#64D2FF] border border-[#64D2FF]/40 hover:border-[#64D2FF]
                     shadow-[0_0_15px_rgba(100,210,255,0.2)] hover:shadow-[0_0_25px_rgba(100,210,255,0.4)]
                     flex items-center justify-center gap-2 group-hover:scale-[1.02]"
          >
            <span>● TRANSMISSION LOCKED</span>
          </button>
        ) : (
          <button
            onClick={() => onSelect(scenario.id)}
            className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase rounded-lg tracking-wider transition-all duration-200
                     bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400
                     text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)]
                     flex items-center justify-center gap-2 group-hover:scale-[1.02]"
          >
            <span>
              {isFlight
                ? (isCompleted ? 'REPLAY FLIGHT' : '⚡ LAUNCH MISSION')
                : (scenario.id === 'vault-breach' ? '⚡ BREACH VAULT' : 'ENTER MODULE')}
            </span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded border border-white/20">[ENTER]</span>
          </button>
        )}
      </div>
    </div>
  );
}
