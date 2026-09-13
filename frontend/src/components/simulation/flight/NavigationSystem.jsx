import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function NavigationSystem({ status, missionResult }) {
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);

  // Navigation graph
  const waypoints = useMemo(() => [
    { id: 'ENTRY', pos: [-4, 0, 0], safe: true },
    { id: 'A', pos: [-2, 2, 0], safe: true },
    { id: 'B', pos: [-2, -2, 0], safe: true },
    { id: 'C', pos: [0, 2, 0], safe: false },
    { id: 'D', pos: [0, -2, 0], safe: true },
    { id: 'E', pos: [2, 1, 0], safe: false },
    { id: 'F', pos: [2, -1, 0], safe: true },
    { id: 'ESCAPE', pos: [4, 0, 0], safe: true },
  ], []);

  const edges = useMemo(() => [
    { from: 'ENTRY', to: 'A' },
    { from: 'ENTRY', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'C', to: 'E' },
    { from: 'D', to: 'F' },
    { from: 'E', to: 'ESCAPE' },
    { from: 'F', to: 'ESCAPE' },
    { from: 'C', to: 'ESCAPE' }, // unsafe direct route
  ], []);

  const safeRoute = useMemo(() => ['ENTRY', 'B', 'D', 'F', 'ESCAPE'], []);
  const isOnline = status === 'online';

  return (
    <group>
      {/* Storm volumes */}
      <StormVolume position={[0, 2, 0]} />
      <StormVolume position={[2, 1, 0]} />

      {/* Edges */}
      {edges.map((edge) => {
        const fromWp = waypoints.find((w) => w.id === edge.from);
        const toWp = waypoints.find((w) => w.id === edge.to);
        if (!fromWp || !toWp) return null;

        const isUnsafe = !fromWp.safe || !toWp.safe;
        const isInSafeRoute = isOnline && safeRoute.includes(edge.from) && safeRoute.includes(edge.to);

        return (
          <NavEdge
            key={`${edge.from}-${edge.to}`}
            start={fromWp.pos}
            end={toWp.pos}
            unsafe={isUnsafe}
            highlighted={isInSafeRoute}
          />
        );
      })}

      {/* Waypoints */}
      {waypoints.map((wp) => {
        const isInSafeRoute = isOnline && safeRoute.includes(wp.id);
        return (
          <Waypoint
            key={wp.id}
            position={wp.pos}
            label={wp.id}
            safe={wp.safe}
            highlighted={isInSafeRoute}
            selected={selectedWaypoint === wp.id}
            onClick={() => setSelectedWaypoint(wp.id === selectedWaypoint ? null : wp.id)}
          />
        );
      })}

      {/* Info Panel */}
      {isOnline && (
        <Html position={[0, -4, 0]} center>
          <div className="px-4 py-3 bg-black/90 border border-[#14b8a6] rounded-[2px] font-mono text-xs text-white pointer-events-none">
            <div className="text-[10px] text-[#B8BAB9] mb-1 uppercase tracking-wider">ROUTE VERIFIED</div>
            <div className="text-sm">SAFE PATH: {safeRoute.join(' → ')}</div>
            <div className="text-[10px] text-[#14b8a6] mt-1">HOPS: {safeRoute.length - 1}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function StormVolume({ position }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.15} wireframe />
    </mesh>
  );
}

function NavEdge({ start, end, unsafe, highlighted }) {
  const lineRef = useRef();

  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((state) => {
    if (lineRef.current && highlighted) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      lineRef.current.material.opacity = 0.5 + pulse * 0.3;
    }
  });

  const color = highlighted ? '#14b8a6' : unsafe ? '#ef4444' : '#6b7280';

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={highlighted ? 0.7 : 0.2} linewidth={2} />
    </line>
  );
}

function Waypoint({ position, label, safe, highlighted, selected, onClick }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      if (highlighted) {
        meshRef.current.scale.setScalar(0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
      } else {
        meshRef.current.scale.setScalar(selected ? 0.4 : 0.3);
      }
    }
  });

  const color = highlighted ? '#14b8a6' : safe ? '#6b7280' : '#ef4444';

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={highlighted ? 0.4 : selected ? 0.3 : 0.1}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <Html position={[0, 1.2, 0]} center>
        <div className={`font-mono text-[10px] px-2 py-1 rounded-[2px] whitespace-nowrap pointer-events-none ${
          highlighted ? 'text-black bg-[#14b8a6]' : 'text-white bg-black/70'
        }`}>
          {label}
        </div>
      </Html>
    </group>
  );
}
