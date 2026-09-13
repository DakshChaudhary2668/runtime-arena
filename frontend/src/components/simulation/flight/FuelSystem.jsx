import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DiagnosticPanel, SystemLabel, SystemPipe, SYSTEM_COLORS } from './SystemPrimitives';

const PARTS = {
  left: { title: 'LEFT WING TANK', position: [-2.85, 0.54, 0.48], connections: 1 },
  right: { title: 'RIGHT WING TANK', position: [2.85, 0.54, 0.48], connections: 1 },
  valveLeft: { title: 'CROSS-FEED VALVE L', position: [-1.32, 0.06, 0.72], connections: 2 },
  valveRight: { title: 'CROSS-FEED VALVE R', position: [1.32, 0.06, 0.72], connections: 2 },
  manifold: { title: 'FUEL MANIFOLD', position: [0, -0.51, 0.85], connections: 3 },
  engine: { title: 'ENGINE FEED', position: [0, -1.5, 0.9], connections: 1 },
};

const LEFT_INLET = [[-2.35, 0.51, 0.45], [-1.9, 0.42, 0.52], [-1.32, 0.06, 0.72]];
const RIGHT_INLET = [[2.35, 0.51, 0.45], [1.9, 0.42, 0.52], [1.32, 0.06, 0.72]];
const LEFT_FEED = [[-1.32, 0.06, 0.72], [-0.79, -0.28, 0.75], [0, -0.51, 0.85]];
const LEFT_BROKEN_A = [[-1.32, 0.06, 0.72], [-0.83, -0.24, 0.75]];
const LEFT_BROKEN_B = [[-0.48, -0.39, 0.79], [0, -0.51, 0.85]];
const RIGHT_FEED = [[1.32, 0.06, 0.72], [0.75, -0.24, 0.77], [0, -0.51, 0.85]];
const ENGINE_FEED = [[0, -0.51, 0.85], [0, -0.98, 0.87], [0, -1.5, 0.9]];

export default function FuelSystem({ online, playRepair, onSequenceChange }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [phase, setPhase] = useState(online && !playRepair ? 3 : 0);
  const connected = phase >= 2;
  const restored = phase >= 3;

  useEffect(() => {
    if (!online) {
      setPhase(0);
      onSequenceChange?.('LOW FLOW / ROUTING FAULT');
      return undefined;
    }
    if (!playRepair) {
      setPhase(3);
      onSequenceChange?.('ENGINE FEED RESTORED');
      return undefined;
    }
    setPhase(1);
    onSequenceChange?.('ROUTING OVERRIDE ACCEPTED');
    const reconfigure = window.setTimeout(() => {
      setPhase(2);
      onSequenceChange?.('RECONFIGURING FUEL PATH');
    }, 1050);
    const restore = window.setTimeout(() => {
      setPhase(3);
      onSequenceChange?.('ENGINE FEED RESTORED');
    }, 3050);
    return () => { window.clearTimeout(reconfigure); window.clearTimeout(restore); };
  }, [online, playRepair, onSequenceChange]);

  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  const selectPart = (id) => (event) => {
    event.stopPropagation();
    setSelected((current) => current === id ? null : id);
  };
  const hoverPart = (id) => (event) => {
    event.stopPropagation();
    setHovered(id);
    document.body.style.cursor = 'pointer';
  };
  const leavePart = () => {
    setHovered(null);
    document.body.style.cursor = '';
  };

  const selectedPart = selected ? PARTS[selected] : null;
  const selectedCritical = selected === 'valveLeft' && !connected;
  const flow = restored ? '78%' : connected ? '42%' : '17%';

  return (
    <group>
      {/* A physical routing bay: two wing tanks, cross-feed valves, a manifold, and engine feed. */}
      <mesh position={[0, -0.48, 0.25]}>
        <boxGeometry args={[4.1, 2.5, 0.13]} />
        <meshStandardMaterial color="#17232b" metalness={0.55} roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.48, 0.34]}>
        <boxGeometry args={[3.94, 2.34, 0.045]} />
        <meshStandardMaterial color="#101b22" metalness={0.45} roughness={0.72} />
      </mesh>
      <SystemPipe points={LEFT_INLET} color={connected ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} flow={!connected || restored} />
      <SystemPipe points={RIGHT_INLET} color={restored ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} flow />
      {connected ? (
        <SystemPipe points={LEFT_FEED} color={restored ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} flow={restored} />
      ) : (
        <>
          <SystemPipe points={LEFT_BROKEN_A} color={SYSTEM_COLORS.red} flow={false} />
          <SystemPipe points={LEFT_BROKEN_B} color={SYSTEM_COLORS.red} flow={false} />
          <FaultArc position={[-0.65, -0.31, 0.79]} />
        </>
      )}
      <SystemPipe points={RIGHT_FEED} color={restored ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} flow={connected} />
      <SystemPipe points={ENGINE_FEED} color={restored ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} flow={restored} radius={0.095} particleCount={7} />

      <FuelTank side={-1} selected={selected === 'left'} hovered={hovered === 'left'} onClick={selectPart('left')} onOver={hoverPart('left')} onOut={leavePart} />
      <FuelTank side={1} selected={selected === 'right'} hovered={hovered === 'right'} onClick={selectPart('right')} onOver={hoverPart('right')} onOut={leavePart} />
      <FuelValve position={PARTS.valveLeft.position} label="L-VALVE / FAULT" connected={connected} phase={phase} selected={selected === 'valveLeft'} hovered={hovered === 'valveLeft'} onClick={selectPart('valveLeft')} onOver={hoverPart('valveLeft')} onOut={leavePart} />
      <FuelValve position={PARTS.valveRight.position} label="R-VALVE" connected phase={3} selected={selected === 'valveRight'} hovered={hovered === 'valveRight'} onClick={selectPart('valveRight')} onOver={hoverPart('valveRight')} onOut={leavePart} />
      <FuelManifold selected={selected === 'manifold'} hovered={hovered === 'manifold'} restored={restored} onClick={selectPart('manifold')} onOver={hoverPart('manifold')} onOut={leavePart} />
      <EngineFeed selected={selected === 'engine'} hovered={hovered === 'engine'} restored={restored} onClick={selectPart('engine')} onOver={hoverPart('engine')} onOut={leavePart} />

      <SystemLabel position={[-0.3, 1.02, 1]}>FUEL CONTROL / CROSS-FEED MATRIX</SystemLabel>
      <SystemLabel position={[0, -2.03, 1]} tone={restored ? 'muted' : 'critical'}>
        {restored ? 'ENGINE FEED · 78% FLOW' : 'ENGINE FEED · LOW FLOW'}
      </SystemLabel>

      {selectedPart && (
        <DiagnosticPanel
          position={[Math.max(-2.4, Math.min(1.2, selectedPart.position[0])), selectedPart.position[1] + 0.8, 1.4]}
          title={selectedPart.title}
          onClose={() => setSelected(null)}
          rows={[
            ['STATUS', selectedCritical ? 'FAULT / DISCONNECTED' : restored ? 'ONLINE' : 'STANDBY'],
            ['FLOW', selected === 'engine' ? flow : selectedCritical ? '0%' : flow],
            ['PRESSURE', restored ? 'NOMINAL' : selectedCritical ? 'LOW' : 'DEGRADED'],
            ['CONNECTIONS', String(selectedPart.connections)],
          ]}
        />
      )}
    </group>
  );
}

function FuelTank({ side, selected, hovered, onClick, onOver, onOut }) {
  return (
    <group position={[side * 2.85, 0.54, 0.48]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.27, 0.27, 1.08, 14]} />
        <meshStandardMaterial color={selected || hovered ? '#607780' : '#3c4d55'} metalness={0.68} roughness={0.42} emissive={selected ? '#315f67' : '#000000'} emissiveIntensity={0.25} />
      </mesh>
      {[-0.37, 0.37].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.284, 0.284, 0.065, 14]} />
          <meshStandardMaterial color="#82949c" metalness={0.78} roughness={0.4} />
        </mesh>
      ))}
      <SystemLabel position={[0, 0.55, 0.25]}>{side < 0 ? 'LEFT WING TANK' : 'RIGHT WING TANK'}</SystemLabel>
    </group>
  );
}

function FuelValve({ position, label, connected, phase, selected, hovered, onClick, onOver, onOut }) {
  const lever = useRef(null);
  const warning = useRef(null);
  useFrame(({ clock }, delta) => {
    if (lever.current) lever.current.rotation.z += ((connected ? Math.PI / 2 : -Math.PI / 4) - lever.current.rotation.z) * Math.min(1, delta * 3);
    if (warning.current) warning.current.material.emissiveIntensity = !connected ? 0.2 + 0.14 * Math.sin(clock.elapsedTime * 4) : phase === 2 ? 0.17 : 0;
  });
  const accent = connected ? phase === 2 ? SYSTEM_COLORS.amber : SYSTEM_COLORS.cyan : SYSTEM_COLORS.red;
  return (
    <group position={position} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.22, 12]} />
        <meshStandardMaterial color={hovered || selected ? '#71838a' : '#42525a'} metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh ref={warning} position={[0, 0, 0.13]}>
        <torusGeometry args={[0.19, 0.026, 5, 18]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={lever} position={[0, 0, 0.2]}>
        <boxGeometry args={[0.38, 0.055, 0.06]} />
        <meshStandardMaterial color="#c2d5dd" metalness={0.7} roughness={0.3} />
      </mesh>
      <SystemLabel position={[0, -0.42, 0.35]} tone={!connected ? 'critical' : 'muted'}>{label}</SystemLabel>
    </group>
  );
}

function FuelManifold({ selected, hovered, restored, onClick, onOver, onOut }) {
  return (
    <group position={PARTS.manifold.position} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh>
        <boxGeometry args={[0.88, 0.35, 0.25]} />
        <meshStandardMaterial color={selected || hovered ? '#647b85' : '#42525b'} metalness={0.72} roughness={0.4} />
      </mesh>
      {[-0.28, 0, 0.28].map((x) => (
        <mesh key={x} position={[x, 0, 0.14]}>
          <boxGeometry args={[0.08, 0.19, 0.03]} />
          <meshBasicMaterial color={restored ? SYSTEM_COLORS.cyan : SYSTEM_COLORS.amber} />
        </mesh>
      ))}
      <SystemLabel position={[0, 0.42, 0.28]}>CENTRAL MANIFOLD</SystemLabel>
    </group>
  );
}

function EngineFeed({ selected, hovered, restored, onClick, onOver, onOut }) {
  const fan = useRef(null);
  useFrame((_, delta) => { if (fan.current && restored) fan.current.rotation.z += delta * 1.1; });
  return (
    <group position={PARTS.engine.position} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <mesh>
        <torusGeometry args={[0.31, 0.085, 7, 24]} />
        <meshStandardMaterial color={selected || hovered ? '#728991' : '#42515a'} metalness={0.8} roughness={0.38} />
      </mesh>
      <group ref={fan}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} rotation={[0, 0, index * Math.PI / 2]} position={[0, 0, 0.05]}>
            <boxGeometry args={[0.05, 0.47, 0.025]} />
            <meshStandardMaterial color={restored ? '#a1d4db' : '#6b7a80'} metalness={0.65} roughness={0.4} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0, 0.08]}>
        <circleGeometry args={[0.07, 12]} />
        <meshBasicMaterial color={restored ? SYSTEM_COLORS.green : SYSTEM_COLORS.red} />
      </mesh>
    </group>
  );
}

function FaultArc({ position }) {
  const beacon = useRef(null);
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.material.opacity = 0.48 + 0.3 * Math.sin(clock.elapsedTime * 4.5);
  });
  return (
    <mesh ref={beacon} position={position}>
      <octahedronGeometry args={[0.095, 0]} />
      <meshBasicMaterial color={SYSTEM_COLORS.red} transparent opacity={0.6} />
    </mesh>
  );
}
