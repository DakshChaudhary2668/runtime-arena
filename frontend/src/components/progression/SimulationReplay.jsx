import React, { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';

const REPLAY_CONFIG = {
  '01': {
    kicker: 'FUEL ROUTING RECONSTRUCTION',
    labels: ['1', '2', '3', '4'],
    resolved: ['4', '3', '2', '1'],
    footer: 'CROSS-FEED VALVE // FLOW RESTORED',
  },
  '02': {
    kicker: 'RADAR CORRIDOR PROPAGATION',
    labels: ['IN', 'A', 'C', 'OUT'],
    resolved: ['IN', 'B', 'D', 'OUT'],
    footer: 'BFS VECTOR // ESCAPE LOCKED',
  },
  '03': {
    kicker: 'GLIDE-SLOPE ENERGY MODEL',
    labels: ['10', '15', '20', '10'],
    resolved: ['0', '10', '15', '25'],
    footer: 'DESCENT CURVE // STABILIZED',
  },
};

export default function SimulationReplay({
  open = false,
  missionId = '01',
  mission = {},
  outcome = {},
  onClose,
}) {
  const [complete, setComplete] = useState(false);
  const config = useMemo(() => REPLAY_CONFIG[missionId] || REPLAY_CONFIG['01'], [missionId]);

  useEffect(() => {
    if (!open) return undefined;
    setComplete(false);
    const timer = window.setTimeout(() => setComplete(true), 4400);
    return () => window.clearTimeout(timer);
  }, [open, missionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label="Mission simulation replay">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[20px] border border-[#E2E2E2] bg-black p-5 sm:p-8">
        <div className="simulation-replay__scan" aria-hidden="true" />

        <header className="relative z-10 flex items-start justify-between gap-4 border-b border-[#E2E2E2] pb-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.24em] text-[#B8BAB9]">// REAL-TIME SIMULATION</div>
            <h3 className="mt-2 font-sans text-xl font-normal tracking-wide text-white sm:text-2xl">
              {mission.title || 'SYSTEM RECOVERY'}
            </h3>
          </div>
          <div className="rounded-[2px] border border-[#E2E2E2] bg-[#444345] px-2 py-1 font-mono text-[9px] text-white">
            {complete ? 'REPLAY COMPLETE' : 'RENDERING'}
          </div>
        </header>

        <div className="relative z-10 py-8 sm:py-10">
          <div className="mb-5 flex items-center justify-between font-mono text-[10px] tracking-widest text-[#E2E2E2]">
            <span>{config.kicker}</span>
            <span>{outcome.timeTaken || '00:00'} / {outcome.attempts || 1} ATTEMPT{outcome.attempts === 1 ? '' : 'S'}</span>
          </div>

          <svg className="simulation-replay__svg" viewBox="0 0 760 250" role="img" aria-label={`${config.kicker} animation`}>
            <path className="simulation-replay__route" d="M80 125 H680" />
            <path className="simulation-replay__pulse" d="M80 125 H680" />
            {config.labels.map((label, index) => {
              const x = 110 + index * 180;
              return (
                <g className={`simulation-replay__node simulation-replay__node--${index + 1}`} key={`${missionId}-${label}-${index}`} transform={`translate(${x} 125)`}>
                  <circle r="31" />
                  <text textAnchor="middle" dominantBaseline="middle">{label}</text>
                  <text className="simulation-replay__resolved" textAnchor="middle" y="68">{config.resolved[index]}</text>
                </g>
              );
            })}
            <g className="simulation-replay__gauge" transform="translate(80 210)">
              <rect width="600" height="12" rx="2" />
              <rect className="simulation-replay__gauge-fill" width="600" height="12" rx="2" />
            </g>
          </svg>

          <div className="mt-5 flex items-center justify-between border-t border-[#E2E2E2] pt-4 font-mono text-[10px] tracking-wider">
            <span className="text-[#B8BAB9]">INPUT SEQUENCE → RESOLVED SEQUENCE</span>
            <span className="text-white">{config.footer}</span>
          </div>
        </div>

        <div className="relative z-10 flex justify-end">
          <Button onClick={onClose} variant="secondary" shortcut="ESC">
            RETURN TO DEBRIEF
          </Button>
        </div>
      </div>
    </div>
  );
}
