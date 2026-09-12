import React from 'react';

export default function TerminalHeader({
  moduleTitle = 'FLIGHT 101',
  missionNumber = '01',
  activeFile = 'main.py',
  onClose,
  keystrokes = 0,
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-black border-b border-[#E2E2E2] select-none">
      {/* Left: Terminal identifier (Strictly Monochrome) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#444345] inline-block" />
          <span className="w-2 h-2 rounded-full bg-[#B8BAB9] inline-block" />
          <span className="w-2 h-2 rounded-full bg-[#E2E2E2] inline-block" />
        </div>
        <span className="font-mono text-xs font-normal tracking-widest text-white ml-2">
          SYSTEM TERMINAL // {moduleTitle}
        </span>
        <span className="font-mono text-[10px] px-2 py-0.5 bg-[#444345] border border-[#E2E2E2] text-white rounded-[2px]">
          MISSION {missionNumber}
        </span>
      </div>

      {/* Center: Active source file */}
      <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#B8BAB9]">
        <span className="text-[#E2E2E2]">FILE:</span>
        <span className="text-white px-2 py-0.5 bg-[#444345] border border-[#E2E2E2] rounded-[2px]">
          {activeFile}
        </span>
        <span className="text-[#E2E2E2] ml-2">KEYSTROKES:</span>
        <span className="text-white">{keystrokes}</span>
      </div>

      {/* Right: Close terminal button */}
      <button
        onClick={onClose}
        className="rt-control flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-white transition-colors cursor-pointer"
        title="Return to flight cockpit scene"
      >
        <span>EXIT TERMINAL</span>
        <span className="text-[9px] text-[#E2E2E2]">[ESC]</span>
      </button>
    </div>
  );
}
