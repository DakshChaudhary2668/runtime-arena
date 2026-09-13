import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

export default function DescentSystem({ status, missionResult }) {
  const aircraftRef = useRef();
  const [progress, setProgress] = React.useState(0);

  const isOnline = status === 'online';

  // Altitude rings
  const rings = useMemo(() => [
    { altitude: 15000, y: 3, radius: 1.5 },
    { altitude: 10000, y: 1, radius: 2 },
    { altitude: 5000, y: -1, radius: 2.5 },
    { altitude: 1000, y: -3, radius: 3 },
  ], []);

  // Descent trajectory curve
  const unsafePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      // Steep unsafe descent
      points.push(new THREE.Vector3(
        -3 + t * 6,
        3 - t * 6.5 - Math.sin(t * Math.PI) * 0.5,
        0
      ));
    }
    return points;
  }, []);

  const safePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      // Smooth controlled descent
      points.push(new THREE.Vector3(
        -3 + t * 6,
        3 - t * 5.5 + Math.sin(t * Math.PI * 0.5) * 0.3,
        0
      ));
    }
    return points;
  }, []);

  const curvePoints = isOnline ? safePoints : unsafePoints;
  const curveColor = isOnline ? '#14b8a6' : '#ef4444';

  useFrame((state) => {
    if (isOnline && aircraftRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 0.3) * 0.5 + 0.5) * 0.4;
      const point = curvePoints[Math.floor(t * curvePoints.length)];
      if (point) {
        aircraftRef.current.position.copy(point);
      }
    }
    if (!isOnline && aircraftRef.current) {
      aircraftRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group>
      {/* Altitude rings */}
      {rings.map((ring) => (
        <AltitudeRing key={ring.altitude} {...ring} status={status} />
      ))}

      {/* Descent trajectory */}
      <Line
        points={curvePoints}
        color={curveColor}
        lineWidth={3}
        transparent
        opacity={0.7}
      />

      {/* Aircraft marker */}
      <group ref={aircraftRef} position={curvePoints[0]}>
        <mesh>
          <coneGeometry args={[0.2, 0.5, 4]} />
          <meshStandardMaterial
            color={isOnline ? '#14b8a6' : '#ef4444'}
            emissive={isOnline ? '#14b8a6' : '#ef4444'}
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Status panel */}
      <Html position={[4, 1, 0]} center>
        <div className="w-56 p-4 bg-black/90 border border-[#E2E2E2] rounded-[2px] font-mono text-xs text-white pointer-events-none">
          <div className="text-[10px] text-[#B8BAB9] uppercase tracking-wider mb-2">DESCENT STATUS</div>
          <div className="space-y-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#B8BAB9]">ALTITUDE</span>
              <span>{isOnline ? '8,420 FT' : '6,100 FT'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B8BAB9]">V/S</span>
              <span className={!isOnline ? 'text-[#ef4444]' : ''}>
                {isOnline ? '-800 FPM' : '-2400 FPM'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B8BAB9]">PROFILE</span>
              <span className={isOnline ? 'text-[#14b8a6]' : 'text-[#ef4444]'}>
                {isOnline ? 'STABLE' : 'UNSTABLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#B8BAB9]">TRAJECTORY</span>
              <span className={isOnline ? 'text-[#14b8a6]' : 'text-[#ef4444]'}>
                {isOnline ? 'VERIFIED' : 'CRITICAL'}
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function AltitudeRing({ altitude, y, radius, status }) {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current && status !== 'online') {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[0, y, 0]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.05, radius, 64]} />
        <meshBasicMaterial
          color={status === 'online' ? '#14b8a6' : '#ef4444'}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html position={[radius + 0.5, 0, 0]} center>
        <div className="font-mono text-[9px] text-[#B8BAB9] bg-black/70 px-1.5 py-0.5 rounded-[2px] whitespace-nowrap pointer-events-none">
          {altitude.toLocaleString()} FT
        </div>
      </Html>
    </group>
  );
}
