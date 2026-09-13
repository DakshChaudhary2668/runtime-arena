import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import EntryPage from './pages/EntryPage';
import LoginPage from './pages/LoginPage';
import ModuleSelectPage from './pages/ModuleSelectPage';
import MissionPage from './pages/MissionPage';
import SpaceRescueComingSoon from './pages/SpaceRescueComingSoon';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Cinematic Entry / Game Title Screen */}
          <Route path="/" element={<EntryPage />} />

          {/* Pilot Access Terminal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Real-time Operations Overview & Profile Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<DashboardPage />} />
          <Route path="/operations" element={<DashboardPage />} />

          {/* Module & Sector Selection Deck */}
          <Route path="/modules" element={<ModuleSelectPage />} />

          {/* Space Rescue Classified Future Operations */}
          <Route path="/modules/space-rescue" element={<SpaceRescueComingSoon />} />
          <Route path="/module/space-rescue" element={<SpaceRescueComingSoon />} />

          {/* Mission Gameplay (Cockpit Scene + HUD + In-World Terminal) */}
          <Route path="/mission/:moduleId/:missionId" element={<MissionPage />} />

          {/* Backward compatibility redirects for legacy routes */}
          <Route path="/workspace" element={<Navigate to="/mission/flight-101/01" replace />} />
          <Route path="/session" element={<Navigate to="/modules" replace />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
