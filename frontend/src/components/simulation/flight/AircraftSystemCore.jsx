import React from 'react';
import * as THREE from 'three';

const steel = '#242d34';
const frame = '#485660';

function StructuralBeam({ start, end, radius = 0.045, color = frame }) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const length = a.distanceTo(b);
  const midpoint = a.clone().add(b).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize(),
  );
  return (
    <mesh position={midpoint} quaternion={rotation}>
      <cylinderGeometry args={[radius, radius, length, 7]} />
      <meshStandardMaterial color={color} metalness={0.56} roughness={0.58} />
    </mesh>
  );
}

export default function AircraftSystemCore() {
  return (
    <group position={[0, 0, -0.65]}>
      {/* A restrained top-down cutaway: nose, central avionics bay, wings, tail. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.86, 5.9, 0.3]} />
        <meshStandardMaterial color={steel} metalness={0.64} roughness={0.52} />
      </mesh>
      <mesh position={[0, 3.03, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.42, 0.95, 4]} />
        <meshStandardMaterial color={frame} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, -2.83, 0]}>
        <coneGeometry args={[0.42, 0.9, 4]} />
        <meshStandardMaterial color={steel} metalness={0.6} roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <StructuralBeam start={[side * 0.3, 0.4, 0]} end={[side * 3.9, -0.7, 0]} radius={0.14} color={steel} />
          <StructuralBeam start={[side * 0.38, -0.45, 0]} end={[side * 3.9, -0.7, 0]} radius={0.085} />
          <StructuralBeam start={[side * 0.35, -2.2, 0]} end={[side * 1.7, -2.8, 0]} radius={0.095} color={steel} />
          <StructuralBeam start={[side * 0.35, -2.75, 0]} end={[side * 1.7, -2.8, 0]} radius={0.045} />
          <mesh position={[side * 2.48, -0.35, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.23, 0.29, 0.68, 10]} />
            <meshStandardMaterial color="#39434b" metalness={0.7} roughness={0.48} />
          </mesh>
        </group>
      ))}
      <StructuralBeam start={[0, 3.15, 0.04]} end={[0, -3.15, 0.04]} radius={0.03} color="#6f858e" />
    </group>
  );
}
