import React from 'react';
import AircraftSystemCore from './flight/AircraftSystemCore';
import FuelSystem from './flight/FuelSystem';
import NavigationSystem from './flight/NavigationSystem';
import DescentSystem from './flight/DescentSystem';

export default function FlightSimulation({ selectedSystem, unlockedSystems, missionResults, onSequenceChange }) {
  const fuelOnline = unlockedSystems.includes('01');
  const navigationOnline = unlockedSystems.includes('02');
  const descentOnline = unlockedSystems.includes('03');

  return (
    <>
      <color attach="background" args={['#060b10']} />
      <fog attach="fog" args={['#060b10', 9, 22]} />
      <ambientLight intensity={0.32} color="#aec4cf" />
      <directionalLight position={[-3, 5, 7]} intensity={1.4} color="#c2d5dd" />
      <pointLight position={[-2.8, -0.6, 2.2]} intensity={fuelOnline ? 0.35 : 0.6} distance={7} color={fuelOnline ? '#7cd9e7' : '#eb665c'} />
      <pointLight position={[2.5, 1.8, 2]} intensity={0.45} distance={8} color="#7cd9e7" />

      <AircraftSystemCore />
      <group position={[0, -0.45, 0.3]} visible={selectedSystem === '01'}>
        <FuelSystem
          online={fuelOnline}
          playRepair={missionResults['01']?.passed === true}
          onSequenceChange={onSequenceChange}
        />
      </group>
      <group position={[0, 2.22, 0.34]} visible={selectedSystem === '02'}>
        <NavigationSystem online={navigationOnline} />
      </group>
      <group position={[0, -2.35, 0.35]} visible={selectedSystem === '03'}>
        <DescentSystem online={descentOnline} />
      </group>
    </>
  );
}
