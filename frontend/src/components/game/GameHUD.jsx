import React, { useState, useEffect } from 'react';
import StatusIndicator from '../common/StatusIndicator';

export default function GameHUD({
  moduleTitle = 'FLIGHT 101',
  missionNumber = '01',
  totalMissions = 3,
  systemHUD = {},
  aiState = 'OBSERVING',
  onOpenTerminal,
  terminalOpen = false,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(systemHUD.timeLimit || 300);

  useEffect(() => {
    setSecondsRemaining(systemHUD.timeLimit || 300);
  }, [systemHUD.timeLimit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      {/* ── TOP HUD BAR ── */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-auto border-b border-[#E2E2E2] bg-black/70 backdrop-blur-md">
        {/* Top-Left: Brand & Mission ID */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#B8BAB9] uppercase">
              RUN TIME ARENA
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-normal tracking-widest text-white">
                {moduleTitle}
              </span>
              <span className="text-[#E2E2E2]">/</span>
              <span className="font-mono text-xs text-[#E2E2E2]">
                MISSION {missionNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Center: Progression Pills (Strictly Monochrome) */}
        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: totalMissions }).map((_, i) => {
            const num = (i + 1).toString().padStart(2, '0');
            const isCurrent = num === missionNumber;
            const isPast = parseInt(num, 10) < parseInt(missionNumber, 10);
            return (
              <div
                key={num}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono border rounded-[2px] ${
                  isCurrent
                    ? 'border-[#E2E2E2] text-white bg-[#444345]'
                    : isPast
                    ? 'border-[#E2E2E2] text-white bg-[#444345]'
                    : 'border-[#B8BAB9] text-[#B8BAB9] bg-black'
                }`}
              >
                <span>{num}</span>
                <span>{isPast ? '✓' : isCurrent ? '●' : '○'}</span>
              </div>
            );
          })}
        </div>

        {/* Top-Right: AI Director State */}
        <div className="flex items-center gap-3">
          <StatusIndicator
            status={
              aiState === 'INTERVENTION'
                ? 'critical'
                : aiState === 'ATTENTION'
                ? 'warning'
                : 'system'
            }
            label={`AI DIRECTOR ● ${aiState}`}
            color={
              aiState === 'INTERVENTION'
                ? '#FF453A'
                : aiState === 'ATTENTION'
                ? '#FFD60A'
                : '#E2E2E2'
            }
          />
        </div>
      </header>

      {/* ── BOTTOM-RIGHT TELEMETRY HUD (Card: rounded-[10px], Restrained Value Accents) ── */}
      <div className="fixed bottom-6 right-6 z-20 hidden md:flex flex-col p-3.5 bg-[#444345]/20 border border-[#E2E2E2] backdrop-blur-md rounded-[10px] min-w-[200px] pointer-events-none">
        <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#B8BAB9] mb-2 border-b border-[#E2E2E2] pb-1">
          // SYSTEM TELEMETRY
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-[#B8BAB9]">ALTITUDE</span>
            <span className="text-white font-normal">{systemHUD.altitude || '18,420 FT'}</span>
          </div>
          {/* Functional Telemetry Value: Oxygen % */}
          <div className="flex justify-between items-center">
            <span className="text-[#B8BAB9]">OXYGEN</span>
            <span className="text-[#E2E2E2] font-normal">{systemHUD.oxygen || '72%'}</span>
          </div>
          {/* Functional Telemetry Value: Hull Integrity % */}
          <div className="flex justify-between items-center">
            <span className="text-[#B8BAB9]">HULL INTEGRITY</span>
            <span className="text-[#30D158] font-normal">{systemHUD.hull || '91%'}</span>
          </div>
          {/* Functional Telemetry Label: Status */}
          <div className="flex justify-between items-center pt-1 border-t border-[#E2E2E2]">
            <span className="text-[#B8BAB9]">STATUS</span>
            <span
              className="font-normal tracking-wider"
              style={{ color: systemHUD.statusColor || '#FF453A' }}
            >
              {systemHUD.status || 'CRITICAL'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#B8BAB9]">TIME WINDOW</span>
            <span className="text-white font-normal">{formatTime(secondsRemaining)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
