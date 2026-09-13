import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlayerAnalytics, requestLiveObservation } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FLIGHT-OPS');
  const [analyzingGroq, setAnalyzingGroq] = useState(false);
  const [groqObservation, setGroqObservation] = useState('');
  const [liveUtc, setLiveUtc] = useState('');
  const [radarAzimuth, setRadarAzimuth] = useState(312);

  // Modals
  const [showDossier, setShowDossier] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedSectorModal, setSelectedSectorModal] = useState(null);

  // User configurable Groq API key stored in localStorage
  const [groqKeyInput, setGroqKeyInput] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [terminalOutput, setTerminalOutput] = useState([
    'ARENA_OS v4.09 [SEC_NET READY]',
    'AUTHENTICATED AS: HARRY // LVL 07 SPECIALIST',
    'TYPE "help" FOR OPERATIONAL COMMANDS',
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Live UTC Clock and radar animation
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const yr = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
      const da = String(d.getUTCDate()).padStart(2, '0');
      const hr = String(d.getUTCHours()).padStart(2, '0');
      const mi = String(d.getUTCMinutes()).padStart(2, '0');
      const se = String(d.getUTCSeconds()).padStart(2, '0');
      setLiveUtc(`${yr}.${mo}.${da} ${hr}:${mi}:${se}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const radarTimer = setInterval(() => {
      setRadarAzimuth((prev) => (prev + 3) % 360);
    }, 150);
    return () => {
      clearInterval(timer);
      clearInterval(radarTimer);
    };
  }, []);

  // Fetch real-time analytics
  const fetchTelemetry = async (silent = false) => {
    try {
      const activeGroqKey = localStorage.getItem('groq_api_key') || '';
      const uid = user?.id || user?.name || 's2';
      const data = await getPlayerAnalytics(uid, activeGroqKey);
      setAnalytics(data);
      if (data.observation && !groqObservation) {
        setGroqObservation(data.observation);
      }
    } catch (err) {
      console.warn('Telemetry fetch notice:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Real-time polling every 4 seconds for live parity
    const poller = setInterval(() => {
      fetchTelemetry(true);
    }, 4000);
    return () => clearInterval(poller);
  }, [user]);

  // Request real-time Groq Game Director observation
  const handleTriggerGroq = async () => {
    setAnalyzingGroq(true);
    try {
      const activeGroqKey = localStorage.getItem('groq_api_key') || '';
      const uid = user?.id || user?.name || 's2';
      const res = await requestLiveObservation(uid, activeGroqKey);
      if (res.observation) {
        setGroqObservation(res.observation);
      }
    } catch (err) {
      console.error('Groq live observation error:', err);
    } finally {
      setAnalyzingGroq(false);
    }
  };

  const handleSaveGroqKey = (e) => {
    e.preventDefault();
    localStorage.setItem('groq_api_key', groqKeyInput.trim());
    setShowConfig(false);
    handleTriggerGroq();
  };

  // Terminal commands
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let response = '';
    if (cmd === 'help') {
      response = 'COMMANDS: status | xp | missions | ping | groq test | clear';
    } else if (cmd === 'status') {
      response = `STATUS: NOMINAL | LATENCY: 12MS | SECTOR: 04 | RANK: ${analytics?.rank || 'Specialist II'}`;
    } else if (cmd === 'xp') {
      response = `TOTAL XP: ${analytics?.total_xp || 1840} | TARGET: ${analytics?.xp_target || 2000} | REMAINING: ${analytics?.xp_remaining || 160} XP`;
    } else if (cmd === 'missions') {
      response = `COMPLETED: ${analytics?.missions_completed || 8} | SUCCESS RATE: ${analytics?.success_rate || 78}%`;
    } else if (cmd === 'ping') {
      response = 'PONG: 12ms // BUFFER 100% NOMINAL';
    } else if (cmd === 'groq test') {
      handleTriggerGroq();
      response = 'GROQ NEURAL PIPELINE DISPATCHED. CHECK MONITORING CARD.';
    } else if (cmd === 'clear') {
      setTerminalOutput([]);
      setTerminalInput('');
      return;
    } else {
      response = `UNKNOWN COMMAND: "${cmd}". TYPE "help" FOR LIST.`;
    }

    setTerminalOutput((prev) => [...prev, `> ${terminalInput}`, response]);
    setTerminalInput('');
  };

  // Safe defaults matching the exact values in the screenshot
  const totalXp = analytics?.total_xp ?? 1840;
  const currentTier = analytics?.current_tier || 'LEVEL 07';
  const xpTarget = analytics?.xp_target || 2000;
  const xpRemaining = analytics?.xp_remaining ?? 160;
  const persistenceStreak = analytics?.persistence_streak || 4;
  const missionProgression = analytics?.mission_progression_pct ?? 67;
  const missionsCompleted = analytics?.missions_completed ?? 8;
  const successRate = analytics?.success_rate ?? 78;
  const firstPassRate = analytics?.first_pass_rate || '14/18 First-pass';
  const aiInterventions = analytics?.ai_interventions ?? 5;
  const avgHintLevel = analytics?.avg_hint_level ?? 1.4;
  const aiDependence = analytics?.ai_dependence || 'VERY LOW';
  const peakAccuracy = analytics?.peak_accuracy || 94.2;
  const avgTimeSolve = analytics?.avg_time_solve || '04:18';
  const avgAttempts = analytics?.avg_attempts || 2.4;
  const codeVelocity = analytics?.code_velocity || 42;
  const recoveryRate = analytics?.recovery_rate || 88;
  const operatorName = analytics?.operator_name || user?.name || 'HARRY';
  const specialistCode = analytics?.specialist_code || 'SPECIALIST_07';
  const rank = analytics?.rank || 'Specialist II';

  const skillMatrix = analytics?.skill_matrix || [
    { name: 'LINKED LISTS (POINTER OPS)', percentage: 85 },
    { name: 'GRAPHS (BFS / DFS / TOPOLOGY)', percentage: 61 },
    { name: 'DYNAMIC PROGRAMMING', percentage: 42 },
    { name: 'STACKS & QUEUES (BUFFER SYNC)', percentage: 38 },
    { name: 'SQL OPTIMIZATION & INDEXING', percentage: 15 },
  ];

  const codingPerformance = analytics?.coding_performance || [
    { session: 'S-01', accuracy: 72, attempts: 3.0 },
    { session: 'S-02', accuracy: 81, attempts: 2.0 },
    { session: 'S-03', accuracy: 70, attempts: 4.0 },
    { session: 'S-04', accuracy: 84, attempts: 3.0 },
    { session: 'S-05', accuracy: 89, attempts: 2.0 },
    { session: 'S-06', accuracy: 87, attempts: 3.0 },
    { session: 'S-07 (LATEST)', accuracy: 94.2, attempts: 2.4 },
  ];

  const recentOperations = analytics?.recent_operations || [
    { mission: 'Reroute Fuel Line', module: 'Flight 101', difficulty: 'Easy', result: 'COMPLETED', attempts: '2 Attempts', xp_gained: '+220 XP', clear_time: '03:21' },
    { mission: 'Navigate the Storm', module: 'Flight 101', difficulty: 'Medium', result: 'IN PROGRESS', attempts: '3 Attempts', xp_gained: '--', clear_time: '--' },
    { mission: 'Memory Buffer Overflow', module: 'Core Engine', difficulty: 'Hard', result: 'COMPLETED', attempts: '4 Attempts', xp_gained: '+450 XP', clear_time: '08:42' },
    { mission: 'Sensor Query Parity', module: 'Vault 09', difficulty: 'Medium', result: 'FAILED', attempts: '2 Attempts', xp_gained: '0 XP', clear_time: '05:14' },
  ];

  const achievements = analytics?.achievements || [
    { id: 'first_recovery', name: 'FIRST RECOVERY', status: 'UNLOCKED', unlocked: true, icon: 'wrench', description: 'Recover system after verification failure' },
    { id: 'no_hint_run', name: 'NO HINT RUN', status: 'UNLOCKED', unlocked: true, icon: 'help', description: 'Clear emergency sequence without AI assistance' },
    { id: 'specialist', name: 'SPECIALIST', status: 'UNLOCKED', unlocked: true, icon: 'trophy', description: 'Reach Level 07 Specialist rank' },
    { id: 'streak_5', name: '5 DAY STREAK', status: '4/5 DAYS', unlocked: false, icon: 'flame', description: 'Maintain active telemetry for 5 consecutive days' },
    { id: 'restorer', name: 'RESTORER', status: 'LOCKED', unlocked: false, icon: 'lock', description: 'Stabilize 10 critical sector flameouts' },
  ];

  const activeObs = groqObservation || analytics?.observation || (
    'SYS_DIRECTOR_OBSERVATION: "Strong performance in pointer-based problems. ' +
    'Graph traversal attempts show hesitation under time pressure. ' +
    'Recommended next focus: BFS pathfinding & queue-based state trees."'
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050811] text-[#E2E2E2] font-mono select-none">
      {/* ═══════════════════════════════════════════
          LEFT SIDEBAR (OPERATOR HUD NAVIGATION)
      ═══════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 bg-[#060a14] border-r border-[#1a2638] flex flex-col justify-between p-3.5 z-20">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#162234]">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse"></span>
            <span className="text-[11px] tracking-wider font-bold text-[#E2E2E2]">RUNTIME_ARENA</span>
            <span className="text-[9px] text-[#4d6b88] ml-auto">// v4.09</span>
          </div>

          {/* Operator Profile Chip */}
          <div className="bg-[#09111e] border border-[#1b2b3f] rounded-xs p-2.5 mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#0b1b2d] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] text-xs font-bold shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              HR
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] text-[#00F0FF] font-bold tracking-wider truncate">
                OPERATOR // {operatorName.toUpperCase()}
              </div>
              <div className="text-[9px] text-[#8b9bb4] tracking-wider">
                {currentTier} SPECIALIST
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-bold tracking-wider">
            {[
              { id: 'FLIGHT-OPS', label: '// FLIGHT-OPS', dot: true },
              { id: 'TELEMETRY', label: '// TELEMETRY' },
              { id: 'SKILL-MATRIX', label: '// SKILL-MATRIX' },
              { id: 'LOGS-ARCHIVE', label: '// LOGS-ARCHIVE' },
              { id: 'MODULES', label: '// MODULES' },
              { id: 'DIAGNOSTICS', label: '// DIAGNOSTICS' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'MODULES') navigate('/modules');
                    if (item.id === 'SKILL-MATRIX') setShowMatrixModal(true);
                    if (item.id === 'DIAGNOSTICS') handleTriggerGroq();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all rounded-xs border-l-2 ${
                    isActive
                      ? 'bg-[#0e1d2e] text-[#00F0FF] border-[#00F0FF] shadow-[inset_0_0_12px_rgba(0,240,255,0.08)]'
                      : 'text-[#7e91a7] hover:text-[#E2E2E2] hover:bg-[#091322] border-transparent'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]"></span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom utility triggers */}
        <div className="space-y-2 pt-3 border-t border-[#162234]">
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              onClick={() => setShowTerminal((prev) => !prev)}
              className="px-2 py-1.5 bg-[#09121f] hover:bg-[#0f1d30] border border-[#1a2a3f] text-[#8b9bb4] hover:text-[#00F0FF] rounded-xs flex items-center justify-center gap-1 transition"
            >
              <span>&gt;_</span> TERMINAL
            </button>
            <button
              onClick={() => setShowConfig(true)}
              className="px-2 py-1.5 bg-[#09121f] hover:bg-[#0f1d30] border border-[#1a2a3f] text-[#8b9bb4] hover:text-[#00F0FF] rounded-xs flex items-center justify-center gap-1 transition"
            >
              <span>⚙</span> CONFIG
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Abort current session and return to sector select?')) {
                navigate('/modules');
              }
            }}
            className="w-full py-1.5 px-2 bg-[#1b0c0f] hover:bg-[#2e1014] border border-[#ef4444]/60 hover:border-[#ef4444] text-[#ef4444] text-[10px] font-bold rounded-xs flex items-center justify-center gap-1.5 tracking-wider transition shadow-[0_0_10px_rgba(239,68,68,0.1)]"
          >
            <span>⨂</span> ABORT // EXIT
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA (SCROLLABLE DASHBOARD)
      ═══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-[#050811]">
        {/* TOP STATUS TICKER BAR */}
        <header className="shrink-0 h-13 bg-[#070c17] border-b border-[#172335] px-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs font-black tracking-wider text-[#E2E2E2]">OPERATIONS OVERVIEW</h1>
                <span className="text-[9px] bg-[#0c1828] text-[#00F0FF] px-1.5 py-0.5 border border-[#00F0FF]/30 rounded-xs font-mono">
                  SECTOR_04
                </span>
              </div>
              <div className="text-[9px] text-[#6d8299] tracking-wider">
                PLAYER STATUS // LIVE PROGRESSION — SECTOR 04
              </div>
            </div>
          </div>

          {/* Center system telemetry tags */}
          <div className="hidden lg:flex items-center gap-5 text-[10px] tracking-wider text-[#8b9bb4]">
            <span className="text-[#00F0FF]/80">LIVE // TELEM</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
              SYS: NOMINAL
            </span>
            <span>FREQ: 142.8MHz</span>
            <span className="flex items-center gap-1.5 bg-[#08221c] text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 rounded-full text-[9px] shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span>
              ONLINE
            </span>
          </div>

          {/* Right quick operator controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#64748b]">
              <button
                onClick={() => alert('No priority alerts. Grid operations normal.')}
                title="Telemetry Bell"
                className="p-1.5 hover:text-[#00F0FF] hover:bg-[#0c1828] rounded-xs transition"
              >
                🔔
              </button>
              <button
                onClick={() => navigate('/mission/flight-101/02')}
                title="Live Audio Monitor"
                className="p-1.5 hover:text-[#00F0FF] hover:bg-[#0c1828] rounded-xs transition"
              >
                📶
              </button>
              <button
                onClick={() => setShowTerminal((p) => !p)}
                title="Cockpit Terminal Overlay"
                className="p-1.5 hover:text-[#00F0FF] hover:bg-[#0c1828] rounded-xs transition"
              >
                📺
              </button>
            </div>

            <div
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 pl-3 border-l border-[#1a2638] cursor-pointer hover:opacity-85 transition"
            >
              <div className="text-right">
                <div className="text-[11px] font-bold text-[#E2E2E2] leading-tight">{operatorName}</div>
                <div className="text-[9px] text-[#00F0FF] leading-tight">{specialistCode}</div>
              </div>
              <div className="w-7 h-7 bg-[#0f2136] border border-[#00F0FF]/50 rounded-xs flex items-center justify-center text-[10px] font-bold text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                07
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════
            DASHBOARD BODY
        ═══════════════════════════════════════════ */}
        <div className="p-4 space-y-4 max-w-[1440px] mx-auto w-full">
          {/* 1. CURRENT OPERATION HERO BANNER */}
          <section className="bg-[#080e1a] border border-[#1a2a40] rounded-xs p-4 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {/* Top banner tag row */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#142236] text-[10px] tracking-wider">
              <div className="flex items-center gap-2">
                <span className="text-[#00F0FF] font-bold">CURRENT OPERATION // PRIORITY ALPHA</span>
                <span className="bg-[#0f1d30] text-[#8b9bb4] px-1.5 py-0.5 border border-[#1d314c] rounded-xs">
                  SEC: FLIGHT-101
                </span>
                <span className="bg-[#0c2420] text-[#10b981] px-1.5 py-0.5 border border-[#10b981]/30 rounded-xs">
                  CYCLE: LIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Left narrative & CTA */}
              <div className="lg:col-span-8 space-y-3">
                <div>
                  <h2 className="text-lg font-black tracking-wider text-[#FFFFFF] drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                    FLIGHT 101 // 02 / 03 — Navigate the Storm
                  </h2>
                  <p className="text-xs text-[#8da0b8] leading-relaxed mt-1 max-w-2xl font-sans">
                    Turbulence algorithms failing. Recalibrate fuel routing &amp; PID flight matrix before engine flameout.
                    Sensor queries require real-time graph verification.
                  </p>
                </div>

                {/* Status metrics row */}
                <div className="grid grid-cols-3 gap-3 pt-1 text-[10px]">
                  <div className="bg-[#0b1424] border border-[#16253a] p-2 rounded-xs">
                    <div className="text-[#64748b] text-[9px] uppercase tracking-wider">CURRENT TIER</div>
                    <div className="text-sm font-black text-[#E2E2E2] mt-0.5">{currentTier}</div>
                  </div>
                  <div className="bg-[#0b1424] border border-[#16253a] p-2 rounded-xs">
                    <div className="text-[#64748b] text-[9px] uppercase tracking-wider">EXP ACCUMULATION</div>
                    <div className="text-sm font-black text-[#00F0FF] mt-0.5">
                      {totalXp.toLocaleString()} / {xpTarget.toLocaleString()} XP
                    </div>
                  </div>
                  <div className="bg-[#0b1424] border border-[#16253a] p-2 rounded-xs">
                    <div className="text-[#64748b] text-[9px] uppercase tracking-wider">PERSISTENCE STREAK</div>
                    <div className="text-sm font-black text-[#10b981] mt-0.5 flex items-center gap-1">
                      <span>⟳</span> {persistenceStreak} DAYS
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-[#8b9bb4]">MISSION PROGRESSION [ {missionProgression}% ]</span>
                    <span className="text-[#00F0FF]">{xpRemaining} XP REMAINING TO LVL 08</span>
                  </div>
                  <div className="h-2 w-full bg-[#0d1829] border border-[#192b43] rounded-xs overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00F0FF] to-[#14b8a6] transition-all duration-700 shadow-[0_0_12px_#00F0FF]"
                      style={{ width: `${missionProgression}%` }}
                    ></div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => navigate('/mission/flight-101/02')}
                    className="px-5 py-2.5 bg-[#00F0FF] hover:bg-[#38f8ff] text-[#050811] text-xs font-black tracking-wider rounded-xs flex items-center gap-2 shadow-[0_0_16px_rgba(0,240,255,0.4)] transition transform active:scale-95"
                  >
                    <span>▶</span> [ CONTINUE MISSION ]
                  </button>

                  <button
                    onClick={() => setShowDossier(true)}
                    className="px-4 py-2.5 bg-[#0c1626] hover:bg-[#12223a] border border-[#213550] text-[#8b9bb4] hover:text-[#E2E2E2] text-xs font-bold tracking-wider rounded-xs flex items-center gap-2 transition"
                  >
                    <span>⌸</span> [ VIEW MODULE DOSSIER ]
                  </button>
                </div>
              </div>

              {/* Right HUD Vector Grid Radar */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-2 bg-[#060c17] border border-[#16253c] rounded-xs relative">
                <div className="w-full flex justify-between text-[9px] text-[#6d8299] mb-1">
                  <span>HUD // VECTOR GRID</span>
                  <span className="text-[#00F0FF]">SCAN: ACTIVE</span>
                </div>

                {/* Radar scope */}
                <div className="relative w-44 h-44 rounded-full border border-[#1b314d] flex items-center justify-center bg-[radial-gradient(circle,#0a1b2e_0%,#050912_80%)] shadow-[inset_0_0_24px_rgba(0,240,255,0.06)] overflow-hidden">
                  {/* Concentric rings */}
                  <div className="absolute w-32 h-32 rounded-full border border-[#14263e]/60"></div>
                  <div className="absolute w-20 h-20 rounded-full border border-[#14263e]/40"></div>
                  <div className="absolute w-8 h-8 rounded-full border border-[#00F0FF]/30"></div>

                  {/* Crosshairs */}
                  <div className="absolute w-full h-[1px] bg-[#14263e]/60"></div>
                  <div className="absolute h-full w-[1px] bg-[#14263e]/60"></div>

                  {/* Sweep line */}
                  <div
                    className="absolute w-22 h-[1px] bg-gradient-to-r from-transparent to-[#00F0FF] origin-left left-1/2 shadow-[0_0_8px_#00F0FF]"
                    style={{ transform: `rotate(${radarAzimuth}deg)` }}
                  ></div>

                  {/* Blips */}
                  <div className="absolute top-10 right-12 w-2 h-2 rounded-xs bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse"></div>
                  <div className="absolute bottom-12 left-10 w-2 h-2 rounded-xs bg-[#ef4444] shadow-[0_0_8px_#ef4444]"></div>
                  <div className="absolute top-20 left-16 w-2 h-2 rounded-xs bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
                </div>

                {/* Radar telemetry readout */}
                <div className="w-full mt-2 pt-2 border-t border-[#142236] flex justify-between items-center text-[9px] font-mono text-[#8b9bb4]">
                  <span>AZIMUTH: {radarAzimuth}° // ELEV: +16°</span>
                  <div className="flex gap-2">
                    <span className="text-[#64748b]">RADAR: DOPPLER V2</span>
                    <span className="text-[#10b981]">PID SYNC: OK</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. FOUR METRIC CARDS ROW */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Missions Completed */}
            <div
              onClick={() => alert(`Missions Completed: ${missionsCompleted} verified arena emergency tasks.`)}
              className="bg-[#080e1a] border border-[#1a2a40] p-3.5 rounded-xs relative overflow-hidden cursor-pointer hover:border-[#00F0FF]/50 transition group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#7e91a7] font-bold">
                <span>MISSIONS COMPLETED</span>
                <span className="text-[#00F0FF]">☑</span>
              </div>
              <div className="text-3xl font-black text-[#E2E2E2] mt-1 tracking-tight">
                {String(missionsCompleted).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-[#10b981] mt-1 font-bold flex items-center gap-1">
                <span>↑</span> +2 this cycle
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1d4ed8]"></div>
            </div>

            {/* Total XP */}
            <div
              onClick={() => setShowConfig(true)}
              className="bg-[#080e1a] border border-[#1a2a40] p-3.5 rounded-xs relative overflow-hidden cursor-pointer hover:border-[#00F0FF]/50 transition group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#7e91a7] font-bold">
                <span>TOTAL XP</span>
                <span className="text-[#00F0FF]">🏆</span>
              </div>
              <div className="text-3xl font-black text-[#00F0FF] mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                {totalXp.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#00F0FF] mt-1 font-bold">
                Rank: {rank}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00F0FF]"></div>
            </div>

            {/* Success Rate */}
            <div
              onClick={() => alert(`Accuracy parity: ${firstPassRate} runs accepted on first submission.`)}
              className="bg-[#080e1a] border border-[#1a2a40] p-3.5 rounded-xs relative overflow-hidden cursor-pointer hover:border-[#10b981]/50 transition group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#7e91a7] font-bold">
                <span>SUCCESS RATE</span>
                <span className="text-[#10b981]">🛡</span>
              </div>
              <div className="text-3xl font-black text-[#E2E2E2] mt-1 tracking-tight">
                {successRate}%
              </div>
              <div className="text-[10px] text-[#8b9bb4] mt-1 font-bold">
                {firstPassRate}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981]"></div>
            </div>

            {/* AI Interventions */}
            <div
              onClick={handleTriggerGroq}
              className="bg-[#080e1a] border border-[#1a2a40] p-3.5 rounded-xs relative overflow-hidden cursor-pointer hover:border-[#00F0FF]/50 transition group"
            >
              <div className="flex justify-between items-center text-[10px] text-[#7e91a7] font-bold">
                <span>AI INTERVENTIONS</span>
                <span className="text-[#00F0FF]">🧠</span>
              </div>
              <div className="text-3xl font-black text-[#E2E2E2] mt-1 tracking-tight">
                {String(aiInterventions).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-[#10b981] mt-1 font-bold">
                Avg level: {avgHintLevel} / {aiDependence.toLowerCase()} dependence
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00F0FF]"></div>
            </div>
          </section>

          {/* 3. MIDDLE ROW: CODING PERFORMANCE & SKILL MATRIX */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* CODING PERFORMANCE CHART */}
            <div className="lg:col-span-7 bg-[#080e1a] border border-[#1a2a40] p-4 rounded-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#142236] text-[10px]">
                  <span className="text-[#E2E2E2] font-bold">CODING PERFORMANCE // LAST 7 SESSIONS</span>
                  <div className="flex items-center gap-3 text-[#8b9bb4]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-[#00F0FF]"></span> Accuracy
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-[#475569]"></span> Attempts
                    </span>
                  </div>
                </div>

                {/* SVG Performance Chart */}
                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal gridlines */}
                    {[20, 55, 90, 125].map((y) => (
                      <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#14243b" strokeDasharray="3 3" />
                    ))}

                    {/* Attempts line (darker subtle trend) */}
                    <polyline
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.5"
                      points="10,85 105,100 200,65 300,90 400,105 500,80 590,95"
                    />

                    {/* Accuracy Area Fill */}
                    <polygon
                      fill="url(#chartGrad)"
                      points="10,75 105,50 200,80 300,45 400,30 500,35 590,15 590,135 10,135"
                    />

                    {/* Accuracy Main Line */}
                    <polyline
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="2.5"
                      points="10,75 105,50 200,80 300,45 400,30 500,35 590,15"
                    />

                    {/* Accuracy Data points */}
                    {[
                      { cx: 10, cy: 75, val: '72%' },
                      { cx: 105, cy: 50, val: '81%' },
                      { cx: 200, cy: 80, val: '70%' },
                      { cx: 300, cy: 45, val: '84%' },
                      { cx: 400, cy: 30, val: '89%' },
                      { cx: 500, cy: 35, val: '87%' },
                      { cx: 590, cy: 15, val: '94.2%' },
                    ].map((pt, idx) => (
                      <g key={idx} className="cursor-pointer group">
                        <circle cx={pt.cx} cy={pt.cy} r="4" fill="#050811" stroke="#00F0FF" strokeWidth="2" />
                        <text
                          x={pt.cx}
                          y={pt.cy - 8}
                          fontSize="9"
                          fill="#00F0FF"
                          textAnchor="middle"
                          className="opacity-80"
                        >
                          {pt.val}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* X-axis Session Labels */}
                  <div className="flex justify-between text-[9px] text-[#64748b] pt-2">
                    {codingPerformance.map((s, idx) => (
                      <span key={idx} className={idx === codingPerformance.length - 1 ? 'text-[#00F0FF] font-bold' : ''}>
                        {s.session}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Footer Stats */}
              <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-[#142236] text-center text-[10px]">
                <div>
                  <div className="text-[9px] text-[#64748b]">PEAK ACCURACY</div>
                  <div className="text-xs font-bold text-[#E2E2E2] mt-0.5">{peakAccuracy}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#64748b]">AVG TIME/SOLVE</div>
                  <div className="text-xs font-bold text-[#E2E2E2] mt-0.5">{avgTimeSolve}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#64748b]">AVG ATTEMPTS</div>
                  <div className="text-xs font-bold text-[#E2E2E2] mt-0.5">{avgAttempts}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#64748b]">AI DEPENDENCE</div>
                  <div className="text-xs font-bold text-[#10b981] mt-0.5">{aiDependence}</div>
                </div>
              </div>
            </div>

            {/* SKILL MATRIX */}
            <div className="lg:col-span-5 bg-[#080e1a] border border-[#1a2a40] p-4 rounded-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#142236] text-[10px]">
                  <span className="text-[#E2E2E2] font-bold">SKILL MATRIX // PROFICIENCY INDEX</span>
                  <span className="text-[#8b9bb4]">TIER: SENIOR DEV</span>
                </div>

                {/* Skill Bars with Segmented Meters */}
                <div className="space-y-3">
                  {skillMatrix.map((sk, idx) => {
                    const totalSegments = 10;
                    const filledSegments = Math.round((sk.percentage / 100) * totalSegments);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#8b9bb4] font-bold">{sk.name}</span>
                          <span className="text-[#00F0FF] font-black">{sk.percentage}%</span>
                        </div>
                        {/* Segmented bar */}
                        <div className="flex gap-1 h-2 w-full">
                          {Array.from({ length: totalSegments }).map((_, segIdx) => (
                            <div
                              key={segIdx}
                              className={`flex-1 rounded-xs transition-all ${
                                segIdx < filledSegments
                                  ? 'bg-[#00F0FF] shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                                  : 'bg-[#0f1d30]'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skill matrix footer CTA */}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#142236] text-[10px]">
                <span className="text-[#64748b]">RECOMMENDED REPS: 3 SESSIONS</span>
                <button
                  onClick={() => setShowMatrixModal(true)}
                  className="text-[#00F0FF] hover:underline font-bold flex items-center gap-1"
                >
                  OPEN MATRIX &gt;
                </button>
              </div>
            </div>
          </section>

          {/* 4. RECENT OPERATIONS FLIGHT LOG JOURNAL */}
          <section className="bg-[#080e1a] border border-[#1a2a40] rounded-xs p-4">
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#142236] text-[10px]">
              <span className="text-[#E2E2E2] font-bold">RECENT OPERATIONS // FLIGHT LOG JOURNAL</span>
              <span className="text-[#10b981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                REALTIME PARITY VERIFIED
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] text-[#64748b] border-b border-[#142236]">
                    <th className="pb-2 font-bold uppercase tracking-wider">MISSION</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">MODULE</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">DIFFICULTY</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">RESULT</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">ATTEMPTS</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">XP GAINED</th>
                    <th className="pb-2 font-bold uppercase tracking-wider">CLEAR TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#101b2c] font-mono text-[11px]">
                  {recentOperations.map((row, idx) => {
                    const isCompleted = row.result === 'COMPLETED';
                    const isInProgress = row.result === 'IN PROGRESS';
                    const isFailed = row.result === 'FAILED';
                    return (
                      <tr key={idx} className="hover:bg-[#0c1626] transition">
                        <td className="py-2.5 font-bold text-[#E2E2E2]">{row.mission}</td>
                        <td className="py-2.5 text-[#8b9bb4]">{row.module}</td>
                        <td className="py-2.5">
                          <span
                            className={
                              row.difficulty === 'Hard'
                                ? 'text-[#ef4444]'
                                : row.difficulty === 'Medium'
                                ? 'text-[#f59e0b]'
                                : 'text-[#8b9bb4]'
                            }
                          >
                            {row.difficulty}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold text-[#10b981] bg-[#0c241c] border border-[#10b981]/30">
                              [ COMPLETED ]
                            </span>
                          )}
                          {isInProgress && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold text-[#00F0FF] bg-[#0b2136] border border-[#00F0FF]/30">
                              [ IN PROGRESS ]
                            </span>
                          )}
                          {isFailed && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold text-[#ef4444] bg-[#220c11] border border-[#ef4444]/30">
                              [ FAILED ]
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-[#8b9bb4]">{row.attempts}</td>
                        <td className="py-2.5 font-bold">
                          <span className={isCompleted ? 'text-[#10b981]' : isFailed ? 'text-[#8b9bb4]' : 'text-[#64748b]'}>
                            {row.xp_gained}
                          </span>
                        </td>
                        <td className="py-2.5 text-[#8b9bb4]">{row.clear_time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Realtime ticker bar */}
            <div className="mt-3 pt-2.5 border-t border-[#142236] text-[9px] text-[#6d8299] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#10b981]">■</span>
                <span>SYS: ONLINE // BUFFER: 100% NOMINAL // LATENCY: 12MS // UTC {liveUtc || '2026.09.13'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>NODE_01: ACTIVE</span>
                <span>ENCRYPTION: AES-256</span>
                <span className="text-[#00F0FF]">FEED: REALTIME</span>
              </div>
            </div>
          </section>

          {/* 5. AI GAME DIRECTOR NEURAL TELEMETRY CARD */}
          <section className="bg-[#080e1a] border border-[#1a2a40] rounded-xs p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#142236] text-[10px]">
              <span className="text-[#E2E2E2] font-bold flex items-center gap-2">
                <span>⚡</span> AI GAME DIRECTOR // NEURAL TELEMETRY
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerGroq}
                  disabled={analyzingGroq}
                  className="px-2 py-0.5 bg-[#0f2136] hover:bg-[#16304e] border border-[#00F0FF]/40 text-[#00F0FF] rounded-xs text-[9px] tracking-wider transition disabled:opacity-50"
                >
                  {analyzingGroq ? 'QUERYING GROQ...' : '↻ RE-ANALYZE VIA GROQ'}
                </button>
                <span className="text-[#00F0FF] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse"></span>
                  MONITORING
                </span>
              </div>
            </div>

            {/* Observation quote box */}
            <div className="bg-[#050b16] border border-[#17273d] p-3 rounded-xs text-xs font-mono text-[#a5b9d2] leading-relaxed">
              <span className="text-[#00F0FF] font-bold">SYS_DIRECTOR_OBSERVATION:</span>{' '}
              <span>{activeObs.replace(/^SYS_DIRECTOR_OBSERVATION:\s*/i, '')}</span>
            </div>

            {/* Neural Telemetry Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] pt-1">
              <div className="bg-[#0a1424] p-2 rounded-xs border border-[#16263c]">
                <div className="text-[#64748b] text-[9px]">HINT REQUESTS</div>
                <div className="text-sm font-bold text-[#E2E2E2] mt-0.5">
                  {String(aiInterventions).padStart(2, '0')}
                </div>
              </div>
              <div className="bg-[#0a1424] p-2 rounded-xs border border-[#16263c]">
                <div className="text-[#64748b] text-[9px]">RECOVERY RATE</div>
                <div className="text-sm font-bold text-[#10b981] mt-0.5">{recoveryRate}%</div>
              </div>
              <div className="bg-[#0a1424] p-2 rounded-xs border border-[#16263c]">
                <div className="text-[#64748b] text-[9px]">AVG INTERVENTION LVL</div>
                <div className="text-sm font-bold text-[#E2E2E2] mt-0.5">{avgHintLevel}</div>
              </div>
              <div className="bg-[#0a1424] p-2 rounded-xs border border-[#16263c]">
                <div className="text-[#64748b] text-[9px]">CODE VELOCITY</div>
                <div className="text-sm font-bold text-[#00F0FF] mt-0.5">{codeVelocity} WPM</div>
              </div>
            </div>
          </section>

          {/* 6. ARENA MODULES (OPERATIONAL SECTORS) */}
          <section className="bg-[#080e1a] border border-[#1a2a40] rounded-xs p-4">
            <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#142236] text-[10px]">
              <span className="text-[#E2E2E2] font-bold">ARENA MODULES // OPERATIONAL SECTORS</span>
              <span className="text-[#8b9bb4]">1 ACTIVE / 3 STANDBY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Flight 101 */}
              <div
                onClick={() => navigate('/mission/flight-101/01')}
                className="bg-[#0a1526] border border-[#00F0FF]/50 p-3.5 rounded-xs cursor-pointer hover:border-[#00F0FF] transition shadow-[0_0_12px_rgba(0,240,255,0.1)] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="font-black text-[#E2E2E2]">FLIGHT 101</span>
                    <span className="px-1.5 py-0.2 bg-[#092b3a] text-[#00F0FF] text-[9px] font-bold rounded-xs border border-[#00F0FF]/30">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7e95b0] leading-snug">
                    Aviation emergency control &amp; sensor telemetry.
                  </p>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] text-[#00F0FF] font-bold">3 MISSIONS // 67%</div>
                  <div className="h-1.5 w-full bg-[#0d1c2e] mt-1 rounded-xs overflow-hidden">
                    <div className="h-full bg-[#00F0FF] w-2/3"></div>
                  </div>
                </div>
              </div>

              {/* Vault Breach */}
              <div
                onClick={() =>
                  setSelectedSectorModal({
                    title: 'VAULT BREACH // OPERATIONAL SECTOR',
                    status: 'LOCKED',
                    desc: 'Cryptographic decryption & binary search locks.',
                    detail: 'Requires pilot clearance level 08 to access sector terminals. Current tier: Level 07 (160 XP remaining).',
                  })
                }
                className="bg-[#09101d] border border-[#16253c] p-3.5 rounded-xs cursor-pointer hover:border-[#22395b] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="font-bold text-[#8b9bb4]">VAULT BREACH</span>
                    <span className="px-1.5 py-0.2 bg-[#141b27] text-[#64748b] text-[9px] rounded-xs">
                      LOCKED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#55677d] leading-snug">
                    Cryptographic decryption &amp; binary search locks.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-[#64748b] font-bold">PREREQ: LVL 08</div>
              </div>

              {/* Data Heist */}
              <div
                onClick={() =>
                  setSelectedSectorModal({
                    title: 'DATA HEIST // OPERATIONAL SECTOR',
                    status: 'CLASSIFIED',
                    desc: 'Relational SQL injection defense & memory tables.',
                    detail: 'Security clearance SEC-LEVEL 4 required. Relational schema defenses undergo calibration.',
                  })
                }
                className="bg-[#09101d] border border-[#16253c] p-3.5 rounded-xs cursor-pointer hover:border-[#22395b] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="font-bold text-[#8b9bb4]">DATA HEIST</span>
                    <span className="px-1.5 py-0.2 bg-[#221711] text-[#f59e0b] text-[9px] rounded-xs border border-[#f59e0b]/30">
                      CLASSIFIED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#55677d] leading-snug">
                    Relational SQL injection defense &amp; memory tables.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-[#f59e0b] font-bold">ENC: SEC-LEVEL 4</div>
              </div>

              {/* Space Rescue */}
              <div
                onClick={() => navigate('/modules/space-rescue')}
                className="bg-[#09101d] border border-[#16253c] p-3.5 rounded-xs cursor-pointer hover:border-[#00F0FF]/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="font-bold text-[#8b9bb4]">SPACE RESCUE</span>
                    <span className="px-1.5 py-0.2 bg-[#121a28] text-[#8b9bb4] text-[9px] rounded-xs">
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-[10px] text-[#55677d] leading-snug">
                    Orbital mechanics &amp; graph network topologies.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-[#8b9bb4] font-bold">STAGE: CONCEPT</div>
              </div>
            </div>
          </section>

          {/* 7. BOTTOM ROW: ACHIEVEMENTS & ACTIVITY SIGNAL */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-8">
            {/* Achievements */}
            <div className="lg:col-span-7 bg-[#080e1a] border border-[#1a2a40] p-4 rounded-xs">
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#142236] text-[10px]">
                <span className="text-[#E2E2E2] font-bold">ACHIEVEMENTS // OPERATOR COMMENDATIONS</span>
                <span className="text-[#00F0FF] font-bold">3 / 5 UNLOCKED</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    onClick={() => setSelectedAchievement(ach)}
                    className={`p-2 rounded-xs border cursor-pointer transition flex flex-col items-center justify-between ${
                      ach.unlocked
                        ? 'bg-[#0a1827] border-[#00F0FF]/40 text-[#00F0FF] hover:border-[#00F0FF]'
                        : 'bg-[#090e17] border-[#162234] text-[#4d5d73] hover:border-[#2a3c54]'
                    }`}
                  >
                    <div className="text-lg my-1">
                      {ach.icon === 'wrench' && '🔧'}
                      {ach.icon === 'help' && '❔'}
                      {ach.icon === 'trophy' && '🏆'}
                      {ach.icon === 'flame' && '🔥'}
                      {ach.icon === 'lock' && '🔒'}
                    </div>
                    <div className="text-[8px] font-bold tracking-tight text-[#E2E2E2] leading-tight">
                      {ach.name}
                    </div>
                    <div
                      className={`text-[7px] font-bold uppercase mt-1 px-1 py-0.5 rounded-xs ${
                        ach.unlocked
                          ? 'bg-[#092c24] text-[#10b981]'
                          : 'bg-[#101926] text-[#64748b]'
                      }`}
                    >
                      {ach.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Signal Matrix */}
            <div className="lg:col-span-5 bg-[#080e1a] border border-[#1a2a40] p-4 rounded-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#142236] text-[10px]">
                  <span className="text-[#E2E2E2] font-bold">ACTIVITY SIGNAL // MISSION CONSISTENCY MATRIX</span>
                  <div className="flex items-center gap-1 text-[8px] text-[#64748b]">
                    <span>LOW</span>
                    <span className="w-1.5 h-1.5 bg-[#0f1d30] inline-block"></span>
                    <span className="w-1.5 h-1.5 bg-[#00F0FF]/40 inline-block"></span>
                    <span className="w-1.5 h-1.5 bg-[#00F0FF] inline-block"></span>
                    <span>HIGH</span>
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-12 gap-1 py-2">
                  {Array.from({ length: 48 }).map((_, idx) => {
                    const intensities = [
                      'bg-[#0a1422]',
                      'bg-[#0d1f36]',
                      'bg-[#00F0FF]/40',
                      'bg-[#00F0FF]',
                      'bg-[#10b981]',
                    ];
                    // deterministic realistic heatmap pattern
                    const intensityIndex = (idx * 7 + 3) % 5;
                    return (
                      <div
                        key={idx}
                        title={`Session ${idx + 1}: ${intensityIndex > 2 ? 'High activity' : 'Routine telemetry'}`}
                        className={`h-3 rounded-xs ${intensities[intensityIndex]} hover:scale-110 transition cursor-pointer`}
                      ></div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#142236] text-[9px] text-[#8b9bb4]">
                <span>CYCLE: 45 SESSIONS RECORDED</span>
                <span className="text-[#10b981] font-bold">STREAK: 4 CONSECUTIVE DAYS</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ═══════════════════════════════════════════
          TACTICAL DOSSIER MODAL
      ═══════════════════════════════════════════ */}
      {showDossier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#080f1e] border border-[#00F0FF]/60 rounded-xs max-w-xl w-full p-5 shadow-[0_0_32px_rgba(0,240,255,0.2)] space-y-4">
            <div className="flex justify-between items-center border-b border-[#1b2f4a] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                <h3 className="text-sm font-black text-[#FFFFFF] tracking-wider">
                  FLIGHT 101 // OPERATIONAL DOSSIER
                </h3>
              </div>
              <button
                onClick={() => setShowDossier(false)}
                className="text-[#64748b] hover:text-[#E2E2E2] font-bold text-xs"
              >
                ✕ [ CLOSE ]
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#9eb3cd] font-sans">
              <div className="bg-[#060c18] p-3 border border-[#14233a] rounded-xs font-mono">
                <div className="text-[#00F0FF] text-[10px] font-bold">OPERATIONAL PARAMETERS</div>
                <div className="text-xs text-[#E2E2E2] mt-1">Airframe: Boeing 777-ER // Sector: North Atlantic Track</div>
                <div className="text-[11px] text-[#8b9bb4]">Failure Mode: Dual PID Turbine Sync Cascade</div>
              </div>

              <p>
                Flight 101 encountered severe clear-air turbulence at FL340. The sensor telemetry query pipeline
                suffered cache invalidation, forcing manual pointer re-routing and linked list restoration before
                starboard flameout.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-[#091424] border border-[#172b46]">
                  <span className="text-[#64748b]">MISSION 01:</span> Reroute Fuel Line (Passed)
                </div>
                <div className="p-2 bg-[#091424] border border-[#172b46]">
                  <span className="text-[#00F0FF]">MISSION 02:</span> Navigate the Storm (Active)
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1b2f4a]">
              <button
                onClick={() => {
                  setShowDossier(false);
                  navigate('/mission/flight-101/02');
                }}
                className="px-4 py-2 bg-[#00F0FF] hover:bg-[#43f8ff] text-[#050811] text-xs font-black rounded-xs tracking-wider transition"
              >
                LAUNCH MISSION 02
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          SKILL MATRIX DETAILED DRILL-DOWN MODAL
      ═══════════════════════════════════════════ */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#080f1e] border border-[#00F0FF]/60 rounded-xs max-w-lg w-full p-5 shadow-[0_0_32px_rgba(0,240,255,0.2)] space-y-4">
            <div className="flex justify-between items-center border-b border-[#1b2f4a] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#00F0FF] font-bold">⚡</span>
                <h3 className="text-sm font-black text-[#FFFFFF] tracking-wider">
                  SKILL MATRIX // DEEP TELEMETRY
                </h3>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-[#64748b] hover:text-[#E2E2E2] font-bold text-xs"
              >
                ✕ [ CLOSE ]
              </button>
            </div>

            <div className="space-y-3">
              {skillMatrix.map((sk, idx) => (
                <div key={idx} className="bg-[#070e1c] border border-[#16273e] p-3 rounded-xs">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#E2E2E2]">{sk.name}</span>
                    <span className="text-[#00F0FF]">{sk.percentage}% Proficiency</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0e1c2e] rounded-xs overflow-hidden">
                    <div className="h-full bg-[#00F0FF]" style={{ width: `${sk.percentage}%` }}></div>
                  </div>
                  <div className="text-[10px] text-[#6d8299] mt-1.5 flex justify-between">
                    <span>Verified in 4 missions</span>
                    <span className="text-[#10b981]">Status: Certified</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1b2f4a]">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 bg-[#00F0FF] text-[#050811] text-xs font-bold rounded-xs"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          COCKPIT TERMINAL DRAWER
      ═══════════════════════════════════════════ */}
      {showTerminal && (
        <div className="fixed bottom-0 right-0 w-full sm:w-[480px] h-80 bg-[#050912]/95 border-t sm:border-l border-[#00F0FF]/50 shadow-[0_0_32px_rgba(0,0,0,0.8)] z-40 flex flex-col font-mono text-xs">
          <div className="bg-[#09121f] px-3 py-2 border-b border-[#182942] flex justify-between items-center text-[#00F0FF]">
            <span className="font-bold flex items-center gap-1.5 text-[11px]">
              <span>&gt;_</span> IN-COCKPIT REALTIME TERMINAL
            </span>
            <button onClick={() => setShowTerminal(false)} className="text-[#64748b] hover:text-[#E2E2E2]">
              ✕
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-[#8b9bb4] text-[11px]">
            {terminalOutput.map((line, idx) => (
              <div key={idx} className={line.startsWith('>') ? 'text-[#00F0FF]' : ''}>
                {line}
              </div>
            ))}
          </div>

          <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-[#182942] flex gap-2 bg-[#060c17]">
            <span className="text-[#00F0FF] py-1">&gt;</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="type status, xp, ping, groq test..."
              className="flex-1 bg-transparent text-[#E2E2E2] focus:outline-hidden text-xs"
              autoFocus
            />
            <button type="submit" className="px-3 py-1 bg-[#00F0FF] text-[#050811] font-bold text-[10px] rounded-xs">
              SEND
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CONFIG MODAL (GROQ API KEY & TELEMETRY SETTINGS)
      ═══════════════════════════════════════════ */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#080f1e] border border-[#00F0FF]/60 rounded-xs max-w-md w-full p-5 shadow-[0_0_32px_rgba(0,240,255,0.2)] space-y-4">
            <div className="flex justify-between items-center border-b border-[#1b2f4a] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#00F0FF]">⚙</span>
                <h3 className="text-sm font-black text-[#FFFFFF] tracking-wider">
                  SYSTEM CONFIG &amp; GROQ API
                </h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-[#64748b] hover:text-[#E2E2E2] font-bold text-xs"
              >
                ✕ [ CLOSE ]
              </button>
            </div>

            <form onSubmit={handleSaveGroqKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#8b9bb4] mb-1">
                  GROQ API KEY (LLAMA-3.1 NEURAL AGENT)
                </label>
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-[#050a14] border border-[#1b2d45] focus:border-[#00F0FF] text-[#E2E2E2] p-2 rounded-xs font-mono text-xs focus:outline-hidden"
                />
                <p className="text-[10px] text-[#55677d] mt-1">
                  Powers the live AI Game Director observation on the profile dashboard.
                </p>
              </div>

              <div className="bg-[#060c18] p-3 border border-[#14233a] rounded-xs text-[11px] text-[#8b9bb4] space-y-1">
                <div>Backend Engine: Flask + SQLite (teamfit.db)</div>
                <div>Telemetry Feed: Polling every 4,000ms</div>
                <div>User ID: {user?.id || 's2'} ({operatorName})</div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('groq_api_key');
                    setGroqKeyInput('');
                    alert('Groq API Key reset to server default.');
                  }}
                  className="text-[#ef4444] text-[10px] hover:underline"
                >
                  Clear Key
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="px-3 py-1.5 bg-[#0e1b2c] text-[#8b9bb4] rounded-xs text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#00F0FF] hover:bg-[#3bf8ff] text-[#050811] rounded-xs text-xs font-black transition"
                  >
                    SAVE &amp; SYNC
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ACHIEVEMENT DETAIL MODAL
      ═══════════════════════════════════════════ */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#080f1e] border border-[#00F0FF]/60 rounded-xs max-w-sm w-full p-4 space-y-3 text-center">
            <div className="text-3xl my-2">
              {selectedAchievement.icon === 'wrench' && '🔧'}
              {selectedAchievement.icon === 'help' && '❔'}
              {selectedAchievement.icon === 'trophy' && '🏆'}
              {selectedAchievement.icon === 'flame' && '🔥'}
              {selectedAchievement.icon === 'lock' && '🔒'}
            </div>
            <h4 className="text-sm font-black text-[#FFFFFF]">{selectedAchievement.name}</h4>
            <p className="text-xs text-[#8b9bb4]">{selectedAchievement.description}</p>
            <div className="text-[10px] font-bold text-[#00F0FF] bg-[#0c1828] py-1 border border-[#1b2f4a] rounded-xs">
              STATUS: {selectedAchievement.status}
            </div>
            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full py-1.5 bg-[#00F0FF] text-[#050811] text-xs font-bold rounded-xs mt-2"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          SECTOR STATUS MODAL
      ═══════════════════════════════════════════ */}
      {selectedSectorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#080f1e] border border-[#00F0FF]/60 rounded-xs max-w-sm w-full p-5 space-y-3">
            <div className="text-xs font-bold text-[#00F0FF]">{selectedSectorModal.title}</div>
            <div className="text-sm font-black text-[#E2E2E2]">{selectedSectorModal.desc}</div>
            <p className="text-xs text-[#8b9bb4] font-sans">{selectedSectorModal.detail}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSectorModal(null)}
                className="px-4 py-1.5 bg-[#00F0FF] text-[#050811] font-bold text-xs rounded-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
