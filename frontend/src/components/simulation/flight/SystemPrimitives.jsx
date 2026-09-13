import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const SYSTEM_COLORS = {
  steel: '#3c4951',
  line: '#6b7c84',
  bone: '#e2e2e2',
  cyan: '#7cd9e7',
  red: '#eb665c',
  amber: '#d5a561',
  green: '#87bca0',
};

export function SystemLabel({ position, children, tone = 'muted' }) {
  return (
    <Html position={position} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
      <span className={`simulation-system-label ${tone === 'critical' ? 'simulation-system-label--critical' : ''}`}>{children}</span>
    </Html>
  );
}

export function DiagnosticPanel({ position, title, rows, onClose }) {
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
      <div className="simulation-diagnostic" onPointerDown={(event) => event.stopPropagation()}>
        <div className="simulation-diagnostic__head">
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label="Close diagnostic">×</button>
        </div>
        {rows.map(([label, value], index) => (
          <div className="simulation-diagnostic__row" key={`${label}-${index}`}>
            <span>{label}</span><strong>{value}</strong>
          </div>
        ))}
        <div className="simulation-diagnostic__foot">SIMULATED SYSTEM TELEMETRY</div>
      </div>
    </Html>
  );
}

export function SystemPipe({ points, color = SYSTEM_COLORS.line, flow = false, particleCount = 5, radius = 0.07, speed = 0.17, opacity = 1 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), [points]);
  const particles = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!flow || !particles.current) return;
    for (let index = 0; index < particleCount; index += 1) {
      const point = curve.getPoint((clock.elapsedTime * speed + index / particleCount) % 1);
      dummy.position.copy(point);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      particles.current.setMatrixAt(index, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 42, radius, 7, false]} />
        <meshStandardMaterial color="#293840" metalness={0.72} roughness={0.4} transparent opacity={opacity} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 42, Math.max(radius * 0.35, 0.018), 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={flow ? 0.7 : 0.43} />
      </mesh>
      <instancedMesh ref={particles} args={[null, null, particleCount]} visible={flow} frustumCulled={false}>
        <sphereGeometry args={[radius * 0.62, 6, 5]} />
        <meshBasicMaterial color={color} />
      </instancedMesh>
    </group>
  );
}
