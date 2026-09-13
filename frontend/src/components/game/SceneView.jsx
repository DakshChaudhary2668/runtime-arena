import React from 'react';

export default function SceneView({
  moduleId = 'flight-101',
  missionId = '01',
  emergency = false,
  shaking = false,
  children,
}) {
  const isFlightModule = moduleId === 'flight-101';
  const isVaultBreach = moduleId === 'vault-breach';

  return (
    <div
      className={`relative w-full h-screen overflow-hidden bg-black select-none ${
        shaking ? 'shake-active' : ''
      }`}
    >
      {/* ── VIDEO BACKGROUND FOR FLIGHT MODULE ── */}
      {isFlightModule && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(1.25) contrast(1.1) saturate(1.05)' }}
          >
            <source src="/videos/flight-emergency.mp4" type="video/mp4" />
          </video>
          {/* Subtle atmospheric tint overlay without crushing video visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
          {/* Emergency red tint overlay */}
          {emergency && (
            <div className="absolute inset-0 bg-red-950/20 animate-pulse-slow" />
          )}
        </div>
      )}

      {/* ── VIDEO BACKGROUND FOR SQL MODULE (VAULT BREACH) ── */}
      {isVaultBreach && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(1.15) contrast(1.15) saturate(1.1)' }}
          >
            <source src="/videos/vault-breach.mp4" type="video/mp4" />
            <source src="/VIDEO-2026-09-13-03-03-30.mp4" type="video/mp4" />
          </video>
          {/* Subtle cyber/security tint overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
          {/* Alert amber pulse when active emergency */}
          {emergency && (
            <div className="absolute inset-0 bg-amber-950/20 animate-pulse-slow" />
          )}
        </div>
      )}

      {/* ── CINEMATIC ARTWORK LAYER (For non-video modules) ── */}
      {!isFlightModule && !isVaultBreach && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Sky gradient - Void black with subtle Charcoal at very low opacity, NO color wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#444345]/10 via-black to-black" />

        {/* Distant atmospheric horizon / storm clouds (Monochrome) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35 mix-blend-screen"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            {/* Subtle monochrome ambient light - strictly white/charcoal */}
            <radialGradient id="stormGlow" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="horizonGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#444345" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Ambient monochrome backdrop */}
          <rect width="1440" height="900" fill="url(#stormGlow)" />

          {/* Artificial Horizon Pitch Ladder - Frost #E2E2E2 / Ash #B8BAB9 */}
          <g opacity="0.14" stroke="#E2E2E2" strokeWidth="1">
            {/* Horizon bar */}
            <line x1="420" y1="450" x2="1020" y2="450" strokeWidth="1.5" strokeDasharray="10 5" />
            {/* 10 deg pitch up */}
            <line x1="580" y1="410" x2="860" y2="410" />
            <text x="560" y="414" fill="#B8BAB9" fontSize="9" fontFamily="monospace">10</text>
            <text x="868" y="414" fill="#B8BAB9" fontSize="9" fontFamily="monospace">10</text>
            {/* 10 deg pitch down */}
            <line x1="580" y1="490" x2="860" y2="490" strokeDasharray="6 4" />
            <text x="560" y="494" fill="#B8BAB9" fontSize="9" fontFamily="monospace">-10</text>
            <text x="868" y="494" fill="#B8BAB9" fontSize="9" fontFamily="monospace">-10</text>
            {/* Aircraft boresight crosshair */}
            <circle cx="720" cy="450" r="8" fill="none" strokeWidth="1.5" />
            <line x1="695" y1="450" x2="712" y2="450" strokeWidth="2" />
            <line x1="728" y1="450" x2="745" y2="450" strokeWidth="2" />
            <line x1="720" y1="442" x2="720" y2="432" strokeWidth="2" />
          </g>

          {/* Cockpit Window Windshield Struts (Cinematic Framing) */}
          <g stroke="#444345" strokeWidth="2" fill="none">
            {/* Center windshield divider */}
            <path d="M720 0 L720 900" stroke="#000000" strokeWidth="16" opacity="0.9" />
            <path d="M720 0 L720 900" stroke="#444345" strokeWidth="2" opacity="0.6" />
            {/* Left windshield diagonal strut */}
            <path d="M0 0 L580 900" stroke="#000000" strokeWidth="14" opacity="0.8" />
            {/* Right windshield diagonal strut */}
            <path d="M1440 0 L860 900" stroke="#000000" strokeWidth="14" opacity="0.8" />
          </g>

          {/* Cockpit Lower Glare-shield dashboard silhouette */}
          <path
            d="M0 720 L300 680 L720 700 L1140 680 L1440 720 L1440 900 L0 900 Z"
            fill="#000000"
            stroke="#444345"
            strokeWidth="2"
          />

          {/* Instrument panel dial lights */}
          <g opacity="0.4">
            <circle cx="200" cy="800" r="35" fill="#000000" stroke="#444345" strokeWidth="1" />
            <circle cx="320" cy="810" r="25" fill="#000000" stroke="#444345" strokeWidth="1" />
            <circle cx="1120" cy="810" r="25" fill="#000000" stroke="#444345" strokeWidth="1" />
            <circle cx="1240" cy="800" r="35" fill="#000000" stroke="#444345" strokeWidth="1" />
            {/* Warning annunciator panel - monochrome background, restrained text-only indicator */}
            <rect x="620" y="740" width="200" height="40" fill="#000000" stroke="#444345" strokeWidth="1" />
            <rect x="630" y="748" width="55" height="24" fill="#000000" stroke="#444345" strokeWidth="1" rx="2" />
            <text x="636" y="764" fill={emergency ? '#FFFFFF' : '#444345'} fontSize="8" fontWeight="bold" fontFamily="monospace">FUEL</text>
            <rect x="692" y="748" width="55" height="24" fill="#000000" stroke="#444345" strokeWidth="1" rx="2" />
            <text x="698" y="764" fill={emergency ? '#E2E2E2' : '#444345'} fontSize="8" fontWeight="bold" fontFamily="monospace">WARN</text>
            <rect x="755" y="748" width="55" height="24" fill="#000000" stroke="#444345" strokeWidth="1" rx="2" />
            <text x="765" y="764" fill="#444345" fontSize="8" fontWeight="bold" fontFamily="monospace">HYD</text>
          </g>
        </svg>

        {/* Cockpit HUD grid lines */}
        <div className="absolute inset-0 cockpit-grid opacity-25" />

        {/* Scanlines layer */}
        <div className="absolute inset-0 scanlines opacity-35" />

        {/* Vignette */}
        <div className="absolute inset-0 vignette" />
        </div>
      )}

      {/* ── SHARED OVERLAY EFFECTS (All Modules) ── */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        {/* Cockpit HUD grid lines */}
        <div className="absolute inset-0 cockpit-grid opacity-20" />
        {/* Scanlines layer */}
        <div className="absolute inset-0 scanlines opacity-25" />
        {/* Subtle vignette for video background */}
        {isFlightModule && <div className="absolute inset-0 vignette-cinematic opacity-30" />}
      </div>

      {/* ── FOREGROUND CONTENT / HUD / STORY SCENE ── */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10">
        {children}
      </div>
    </div>
  );
}
