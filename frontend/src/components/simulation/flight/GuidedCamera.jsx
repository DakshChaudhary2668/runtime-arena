import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const VIEWS = {
  '01': { position: [0, -0.25, 10], target: [0, -0.25, 0] },
  '02': { position: [0, 2.25, 7.4], target: [0, 2.25, 0] },
  '03': { position: [0, -2.35, 7.7], target: [0, -2.35, 0] },
};

export default function GuidedCamera({ selectedSystem, recenterKey = 0 }) {
  const { camera } = useThree();
  const controls = useRef(null);
  const firstView = useRef(true);
  const [moving, setMoving] = useState(true);
  const destination = VIEWS[selectedSystem] || VIEWS['01'];
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useEffect(() => {
    targetPosition.current.set(...destination.position);
    targetLook.current.set(...destination.target);
    if (firstView.current) {
      camera.position.set(0, -3.2, 15);
      controls.current?.target.set(0, -1.8, 0);
      firstView.current = false;
    }
    setMoving(true);
  }, [camera, destination, recenterKey]);

  useFrame((_, delta) => {
    if (!controls.current || !moving) return;
    const factor = 1 - Math.exp(-delta * 2.4);
    camera.position.lerp(targetPosition.current, factor);
    controls.current.target.lerp(targetLook.current, factor);
    controls.current.update();
    if (camera.position.distanceTo(targetPosition.current) < 0.035 &&
        controls.current.target.distanceTo(targetLook.current) < 0.035) {
      camera.position.copy(targetPosition.current);
      controls.current.target.copy(targetLook.current);
      controls.current.update();
      setMoving(false);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={!moving}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.36}
      zoomSpeed={0.45}
      minDistance={6.2}
      maxDistance={11}
      minPolarAngle={Math.PI / 2 - 0.2}
      maxPolarAngle={Math.PI / 2 + 0.2}
      minAzimuthAngle={-0.24}
      maxAzimuthAngle={0.24}
    />
  );
}
