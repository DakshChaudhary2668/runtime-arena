import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import SimulationReplay from './SimulationReplay';

export default function MissionDebrief({
  open = false,
  moduleTitle = 'FLIGHT 101',
  mission = {},
  nextMissionId,
  timeTaken = '02:14',
  attempts = 1,
  efficiency = 92,
  interventions = 0,
  xpEarned = 250,
  aiDebriefText = '',
  onNextMission,
  onReturnToDeck,
}) {
  const [simulationOpen, setSimulationOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSimulationOpen(false);
      return undefined;
    }
    const handleReplayShortcut = (event) => {
      if ((event.key === 's' || event.key === 'S') && !simulationOpen) {
        event.preventDefault();
        setSimulationOpen(true);
      } else if (event.key === 'Escape' && simulationOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setSimulationOpen(false);
      }
    };
    window.addEventListener('keydown', handleReplayShortcut, true);
    return () => window.removeEventListener('keydown', handleReplayShortcut, true);
  }, [open, simulationOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Debrief Container - 20px border-radius per Design.md */}
      <div className="relative w-full max-w-xl bg-[#444345]/20 border border-[#E2E2E2] p-6 sm:p-8 rounded-[20px]">
        {/* Top Status Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E2] mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
            <span className="font-mono text-xs tracking-[0.25em] text-white uppercase font-normal">
              // MISSION COMPLETE
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#444345] border border-[#E2E2E2] text-white rounded-[2px]">
            {moduleTitle} / {mission.number || '01'}
          </span>
        </div>

        {/* Mission Title & Resolution */}
        <div className="mb-6">
          <h2 className="font-sans text-2xl font-normal tracking-wide text-white mb-1">
            {mission.title || 'SYSTEM OVERRIDE'}
          </h2>
          <p className="font-mono text-xs text-[#E2E2E2] tracking-wide">
            STABILIZATION SEQUENCE ACCEPTED • TELEMETRY VERIFIED
          </p>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#444345]/20 border border-[#E2E2E2] rounded-[2px] mb-6 font-mono">
          <div>
            <div className="text-[9px] text-[#B8BAB9] uppercase tracking-wider mb-1">TIME</div>
            <div className="text-sm sm:text-base font-normal text-white">{timeTaken}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#B8BAB9] uppercase tracking-wider mb-1">ATTEMPTS</div>
            <div className="text-sm sm:text-base font-normal text-white">{attempts}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#B8BAB9] uppercase tracking-wider mb-1">EFFICIENCY</div>
            <div className="text-sm sm:text-base font-normal text-white">{efficiency}%</div>
          </div>
          <div>
            <div className="text-[9px] text-[#B8BAB9] uppercase tracking-wider mb-1">XP EARNED</div>
            <div className="text-sm sm:text-base font-normal text-white">+{xpEarned}</div>
          </div>
        </div>

        {/* System Bar Visualization - Strictly Monochrome */}
        <div className="mb-6 font-mono">
          <div className="flex justify-between text-[10px] text-[#B8BAB9] mb-1.5">
            <span>AIRFRAME STABILITY</span>
            <span className="text-white">94% RESTORED</span>
          </div>
          <div className="w-full h-2 bg-black border border-[#E2E2E2] rounded-[2px] overflow-hidden p-[1px]">
            <div className="h-full bg-[#E2E2E2] rounded-[2px] w-[94%]" />
          </div>
        </div>

        {/* AI Game Director Debrief Statement */}
        <div className="p-4 bg-black border-2 border-[#E2E2E2] rounded-[2px] mb-8 font-mono">
          <div className="flex items-center gap-2 text-[10px] text-[#E2E2E2] font-normal tracking-widest uppercase mb-1.5">
            <span>◆</span>
            <span>AI GAME DIRECTOR DEBRIEF</span>
          </div>
          <p className="text-xs text-[#E2E2E2] leading-relaxed italic font-sans">
            "{aiDebriefText || mission.aiResponses?.successDebrief || 'You stabilized the emergency systems before catastrophic integrity failure.'}"
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 pt-2">
          <Button
            onClick={() => setSimulationOpen(true)}
            variant="secondary"
            shortcut="S"
            className="w-full"
          >
            RUN SIMULATION
          </Button>

          {nextMissionId ? (
            <Button
              onClick={onNextMission}
              variant="primary"
              shortcut="N"
              className="w-full"
            >
              PROCEED TO MISSION {nextMissionId}
            </Button>
          ) : (
            <div className="font-mono text-xs text-white font-normal text-center">
              ★ MODULE ALL MISSIONS CLEARED!
            </div>
          )}

          <Button
            onClick={onReturnToDeck}
            variant="secondary"
            shortcut="A"
            className="w-full"
          >
            MODULE DECK
          </Button>
        </div>
      </div>

      <SimulationReplay
        open={simulationOpen}
        missionId={mission.id || mission.number || '01'}
        mission={mission}
        outcome={{ timeTaken, attempts, efficiency, xpEarned }}
        onClose={() => setSimulationOpen(false)}
      />
    </div>
  );
}
