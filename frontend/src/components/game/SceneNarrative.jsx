import React from 'react';
import TypewriterText from '../common/TypewriterText';
import Button from '../common/Button';

export default function SceneNarrative({
  moduleTitle = 'FLIGHT 101',
  mission = {},
  onOpenTerminal,
  onNarrativeComplete,
}) {
  return (
    <div className="max-w-2xl bg-transparent border border-[#E2E2E2] p-6 sm:p-8 rounded-[20px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
      {/* Header Eyebrow (Strictly Monochrome) */}
      <div className="flex items-center gap-3 mb-4 border-b border-[#E2E2E2] pb-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-[#B8BAB9] uppercase">
          // INCIDENT LOG: {moduleTitle}
        </span>
        <span className="text-[#E2E2E2]">|</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#B8BAB9]">
          SECTOR 0{mission.number || '1'}
        </span>
        <span className="ml-auto font-mono text-[9px] px-2 py-0.5 bg-[#444345] border border-[#E2E2E2] text-white tracking-widest rounded-[2px]">
          EMERGENCY PRIORITY
        </span>
      </div>

      {/* Narrative Typewriter */}
      <div className="mb-6 font-mono min-h-[140px]">
        <TypewriterText
          lines={mission.narrative || []}
          speed={20}
          onComplete={onNarrativeComplete}
        />
      </div>

      {/* Target Directive / Objective Callout */}
      <div className="p-3 mb-6 bg-transparent border-l-2 border-[#E2E2E2] rounded-r-[2px]">
        <span className="block text-[10px] font-mono tracking-widest uppercase text-[#B8BAB9] mb-1">
          TACTICAL OBJECTIVE
        </span>
        <p className="text-xs sm:text-sm text-white font-mono leading-normal">
          {mission.objective || 'Access the emergency terminal to restore operational balance.'}
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={onOpenTerminal}
          variant="primary"
          shortcut="F"
          className="w-full sm:w-auto"
        >
          ACCESS TERMINAL
        </Button>
        <span className="text-[10px] font-mono text-[#B8BAB9] tracking-wider hidden sm:inline-block">
          PRESS [F] TO INITIALIZE MONACO CONSOLE
        </span>
      </div>
    </div>
  );
}
