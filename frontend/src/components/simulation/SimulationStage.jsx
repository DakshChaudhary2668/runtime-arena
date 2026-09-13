import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import FlightSimulation from './FlightSimulation';
import GuidedCamera from './flight/GuidedCamera';
import './simulation.css';

const SYSTEMS = [
  { id: '01', label: 'FUEL', detail: 'ROUTING MATRIX' },
  { id: '02', label: 'NAVIGATION', detail: 'RADAR CORRIDOR' },
  { id: '03', label: 'FLIGHT CONTROL', detail: 'DESCENT PROFILE' },
];

export default function SimulationStage({
  open = false,
  moduleId = 'flight-101',
  unlockedSystems = [],
  missionResults = {},
  onClose,
}) {
  const [selectedSystem, setSelectedSystem] = useState('01');
  const [recenterKey, setRecenterKey] = useState(0);
  const [bootStage, setBootStage] = useState(0);
  const [sequence, setSequence] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setSelectedSystem(unlockedSystems[0] || '01');
    setBootStage(0);
    const first = window.setTimeout(() => setBootStage(1), 380);
    const second = window.setTimeout(() => setBootStage(2), 1120);
    const third = window.setTimeout(() => setBootStage(3), 1900);
    return () => [first, second, third].forEach(window.clearTimeout);
    // Opening is the only reset event; progression changes should not reset the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;
  const active = SYSTEMS.find((system) => system.id === selectedSystem) || SYSTEMS[0];
  const isStable = unlockedSystems.includes(selectedSystem);
  const statusText = selectedSystem === '01' && sequence ? sequence : isStable ? 'STABLE' : 'CRITICAL';

  return (
    <div className="simulation-experience" role="dialog" aria-modal="true" aria-label="Flight 101 aircraft systems simulation">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.6]}
        shadows={false}
        camera={{ position: [0, -3.2, 15], fov: 46, near: 0.1, far: 35 }}
      >
        <PerspectiveCamera makeDefault position={[0, -3.2, 15]} fov={46} near={0.1} far={35} />
        <GuidedCamera selectedSystem={selectedSystem} recenterKey={recenterKey} />
        {moduleId === 'flight-101' && (
          <FlightSimulation
            selectedSystem={selectedSystem}
            unlockedSystems={unlockedSystems}
            missionResults={missionResults}
            onSequenceChange={setSequence}
          />
        )}
      </Canvas>

      <div className="simulation-vignette" aria-hidden="true" />
      <div className="simulation-scanline" aria-hidden="true" />

      <header className="simulation-hud simulation-hud--top">
        <div>
          <div className="simulation-kicker">FLIGHT 101 <span>/</span> AIRCRAFT SYSTEMS</div>
          <div className="simulation-hud__sub">DIGITAL TWIN · EMERGENCY CORE</div>
        </div>
        <div className="simulation-status">
          <span>SYSTEM STATUS</span>
          <strong className={isStable ? 'simulation-status--stable' : 'simulation-status--critical'}>{statusText}</strong>
        </div>
      </header>

      <div className="simulation-side-label" aria-hidden="true">
        <span>AVIONICS / {active.detail}</span>
        <span>FIG. {active.id} — SIMULATED DIAGNOSTIC VIEW</span>
      </div>

      <div className="simulation-controls">
        <button type="button" onClick={() => setRecenterKey((key) => key + 1)}>RECENTER SYSTEM</button>
        <button type="button" onClick={onClose}>EXIT [ESC]</button>
      </div>

      <nav className="simulation-selector" aria-label="Aircraft subsystems">
        {SYSTEMS.map((system) => {
          const unlocked = unlockedSystems.includes(system.id);
          return (
            <button
              key={system.id}
              type="button"
              disabled={!unlocked && system.id !== selectedSystem}
              aria-current={selectedSystem === system.id ? 'page' : undefined}
              onClick={() => { setSequence(''); setSelectedSystem(system.id); }}
              className={`${selectedSystem === system.id ? 'is-selected' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
            >
              <span>{system.id} {system.label}</span>
              <small>{unlocked ? 'ACCESS GRANTED' : 'LOCKED'}</small>
            </button>
          );
        })}
      </nav>

      {bootStage < 3 && (
        <div className={`simulation-boot simulation-boot--${bootStage}`} aria-live="polite">
          <div className="simulation-boot__line" />
          <p>{bootStage === 0 ? 'INITIALIZING AIRCRAFT SYSTEMS' : bootStage === 1 ? 'LINKING EMERGENCY AVIONICS' : 'DIAGNOSTIC CORE ONLINE'}</p>
          <span>FLIGHT 101 / INTERNAL SYSTEMS VIEW</span>
        </div>
      )}
    </div>
  );
}
