import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function TacticalGrid() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={gridRef} position={[0, -2, -1]}>
      <gridHelper args={[20, 20, '#14b8a6', '#14b8a6']} rotation={[0, 0, 0]} material-opacity={0.15} material-transparent />
    </group>
  );
}
