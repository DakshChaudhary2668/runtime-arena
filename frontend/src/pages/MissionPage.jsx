import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScenario, getMission } from '../data/scenarios';
import { useAuth } from '../context/AuthContext';
import { executeCode, requestDirectorHint, updateKeystrokes } from '../services/api';
import { connectAgoraVoice } from '../services/voiceAgent';
import { buildDirectorContext } from '../utils/directorContext';

import SceneView from '../components/game/SceneView';
import GameHUD from '../components/game/GameHUD';
import SceneNarrative from '../components/game/SceneNarrative';
import TerminalOverlay from '../components/terminal/TerminalOverlay';
import MissionDebrief from '../components/progression/MissionDebrief';

export default function MissionPage() {
  const { moduleId = 'flight-101', missionId = '01' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentName = user?.name || 'Pilot Candidate';

  // Load Scenario & Mission data
  const scenario = getScenario(moduleId);
  const mission = getMission(moduleId, missionId);

  // ── Mission Gameplay State ──
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [code, setCode] = useState(mission?.starterCode || '');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [emergency, setEmergency] = useState(true);

  // ── AI Game Director State ──
  const [aiState, setAiState] = useState('OBSERVING');
  const [hintLevel, setHintLevel] = useState(0);
  const [aiMessage, setAiMessage] = useState(mission?.aiResponses?.observing || '');
  const [askingAI, setAskingAI] = useState(false);
  const [voiceState, setVoiceState] = useState('OFF');

  // ── Debrief & Timing State ──
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeTaken, setTimeTaken] = useState('00:00');

  // Keystroke telemetry refs
  const keystrokeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const voiceSessionRef = useRef(null);

  // Synchronize when route mission changes
  useEffect(() => {
    if (mission) {
      setCode(mission.starterCode || '');
      setOutput(null);
      setAttempts(0);
      setHintLevel(0);
      setAiState('OBSERVING');
      setAiMessage(mission.aiResponses?.observing || 'Telemetry nominal.');
      setDebriefOpen(false);
      setTerminalOpen(false);
      setEmergency(true);
      voiceSessionRef.current?.stop();
      voiceSessionRef.current = null;
      setVoiceState('OFF');
    }
  }, [moduleId, missionId]);

  useEffect(() => () => {
    voiceSessionRef.current?.stop();
    voiceSessionRef.current = null;
  }, []);

  // Sync Keystroke Deltas every 5s to backend
  useEffect(() => {
    const interval = setInterval(() => {
      const currentKs = keystrokeRef.current;
      const delta = currentKs - lastSyncRef.current;
      if (delta > 0) {
        lastSyncRef.current = currentKs;
        updateKeystrokes(studentName, delta, terminalOpen ? 'typing' : 'idle').catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [studentName, terminalOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // If debrief is open
      if (debriefOpen) {
        if (e.key === 'n' || e.key === 'N') {
          handleNextMission();
        } else if (e.key === 'a' || e.key === 'A' || e.key === 'Escape') {
          navigate('/modules');
        }
        return;
      }

      // If user is inside Monaco editor, don't hijack typing keys
      const activeEl = document.activeElement;
      const isInEditor = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.closest('.monaco-editor'));

      if (e.key === 'Escape') {
        if (terminalOpen) {
          setTerminalOpen(false);
        } else {
          navigate('/modules');
        }
      } else if (!isInEditor) {
        if ((e.key === 'f' || e.key === 'F') && !terminalOpen) {
          setTerminalOpen(true);
        } else if (e.key === 'a' || e.key === 'A') {
          navigate('/modules');
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [terminalOpen, debriefOpen, navigate]);

  // Code editor change
  const handleEditorChange = (value) => {
    setCode(value || '');
    keystrokeRef.current += 1;
    setKeystrokes(keystrokeRef.current);
  };

  // Run Code Execution
  const handleRunCode = async () => {
    if (!code.trim()) return;

    setRunning(true);
    setAttempts((prev) => prev + 1);

    try {
      // Execute code via real backend endpoint
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      const projectedAttempts = attempts + 1;
      const projectedXp = Math.max(100, 250 - (projectedAttempts - 1) * 25 - hintLevel * 15);
      const result = await executeCode(code, 71, studentName, {
        user_id: user?.id || studentName,
        module_id: moduleId,
        mission_id: missionId,
        topic: mission?.topic || '',
        attempts: projectedAttempts,
        hint_level: hintLevel,
        xp_earned: projectedXp,
        xp_deducted: hintLevel * 15,
        time_seconds: elapsedSecs,
      });
      setOutput(result);

      const hasStdErr = result.stderr && result.stderr.trim().length > 0;
      const isAccepted = result.status === 'Accepted' && !hasStdErr;

      const currentContext = buildDirectorContext({
        user,
        scenario,
        mission,
        attempts: projectedAttempts,
        hintLevel,
        lastExecution: result,
      });
      if (voiceSessionRef.current) {
        voiceSessionRef.current.updateContext(currentContext);
      }

      if (isAccepted) {
        // Mission Accomplished!
        setAiState('RESOLVED');
        setAiMessage(mission?.aiResponses?.recovery || 'Sequence verified. Airframe stabilized.');
        setEmergency(false);

        if (voiceSessionRef.current) {
          voiceSessionRef.current.speak('Stabilization sequence accepted. Power grid restored. Outstanding work, Pilot.');
        }

        // Calculate time taken
        const m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
        const s = (elapsedSecs % 60).toString().padStart(2, '0');
        setTimeTaken(`${m}:${s}`);

        // Open debrief after brief pause
        setTimeout(() => {
          setTerminalOpen(false);
          setDebriefOpen(true);
        }, 1200);
      } else {
        // Execution failure or wrong answer
        setShaking(true);
        setTimeout(() => setShaking(false), 450);

        if (attempts >= 1) {
          setAiState('INTERVENTION');
          setAiMessage(mission?.aiResponses?.intervention || 'Execution failed. Check pointer sequence logic.');
          setHintLevel((h) => Math.max(h, 1));
        } else {
          setAiState('ATTENTION');
          setAiMessage(mission?.aiResponses?.attention || 'Deviation detected. Verification harness did not pass.');
        }
      }
    } catch (err) {
      const errorResult = {
        stdout: '',
        stderr: err.message || 'Transmission disrupted. Check arena connection.',
        status: 'Error',
        time: '0.00',
        memory: '0',
      };
      setOutput(errorResult);
      if (voiceSessionRef.current) {
        voiceSessionRef.current.updateContext(buildDirectorContext({
          user,
          scenario,
          mission,
          attempts: attempts + 1,
          hintLevel,
          lastExecution: errorResult,
        }));
      }
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      setAiState('ATTENTION');
      setAiMessage('Emergency network link timeout. Local telemetry isolated.');
    } finally {
      setRunning(false);
    }
  };

  // Ask AI Director for Hint
  const handleAskAI = async (question = '') => {
    setAskingAI(true);
    const fallback = mission?.aiResponses?.intervention || 'Focus on pointer swaps before progressing to the next node.';
    try {
      const result = await requestDirectorHint({
        question,
        mission: {
          id: mission?.id,
          title: mission?.title,
          topic: mission?.topic,
          objective: mission?.objective,
        },
        code,
        hint_level: hintLevel,
        fallback,
      });
      const nextHint = Math.min(hintLevel + 1, 3);
      setHintLevel(nextHint);
      setAiState('INTERVENTION');
      setAiMessage(result?.message || fallback);

      if (voiceSessionRef.current) {
        voiceSessionRef.current.updateContext(buildDirectorContext({
          user,
          scenario,
          mission,
          attempts,
          hintLevel: nextHint,
          lastExecution: output,
        }));
      }
    } catch (error) {
      console.warn('AI Director network hint unavailable; using mission hint:', error);
      const nextHint = Math.min(hintLevel + 1, 3);
      setHintLevel(nextHint);
      setAiState('INTERVENTION');
      setAiMessage(fallback);
      if (voiceSessionRef.current) {
        voiceSessionRef.current.updateContext(buildDirectorContext({
          user,
          scenario,
          mission,
          attempts,
          hintLevel: nextHint,
          lastExecution: output,
        }));
      }
    } finally {
      setAskingAI(false);
    }
  };

  const formatVoiceErrorBadge = (reason) => {
    switch (reason) {
      case 'TOKEN_EXPIRED':
        return 'TOKEN EXPIRED';
      case 'VOICE_CONFIG_MISSING':
        return 'CONFIG MISSING';
      case 'LLM_CONFIG_MISSING':
        return 'LLM KEY MISSING';
      case 'VOICE_SERVICE_OFFLINE':
        return 'SERVICE OFFLINE';
      case 'MICROPHONE_ACCESS_DENIED':
        return 'MIC DENIED';
      case 'MICROPHONE_HARDWARE_NOT_FOUND':
        return 'NO MIC FOUND';
      case 'MICROPHONE_IN_USE':
        return 'MIC IN USE';
      case 'MICROPHONE_UNSUPPORTED':
        return 'MIC UNSUPPORTED';
      case 'AGORA_CONNECTION_FAILED':
        return 'RTC FAILED';
      case 'AGORA_SIGNALING_FAILED':
        return 'RTM FAILED';
      case 'AGENT_SESSION_FAILED':
        return 'AGENT FAILED';
      default:
        return 'UNAVAILABLE';
    }
  };

  const handleToggleVoice = async () => {
    if (voiceState === 'CONNECTING') return;

    const current = voiceSessionRef.current;
    if (current) {
      await current.setMuted(!current.muted).catch((error) => {
        console.warn('Agora microphone toggle failed:', error);
        setVoiceState('OFF');
      });
      return;
    }

    const currentContext = buildDirectorContext({
      user,
      scenario,
      mission,
      attempts,
      hintLevel,
      lastExecution: output,
    });

    const result = await connectAgoraVoice({
      mission,
      hintLevel,
      context: currentContext,
      onState: setVoiceState,
      onTranscript: (message) => {
        setHintLevel((prev) => Math.min(prev + 1, 3));
        setAiState('INTERVENTION');
        setAiMessage(message);
      },
    });
    if (result?.ok && result.session) {
      voiceSessionRef.current = result.session;
    } else {
      const badge = formatVoiceErrorBadge(result?.reason);
      console.warn(`[Voice] Initialization halted: [${result?.reason || 'UNKNOWN'}] ${result?.message || ''}`);
      setVoiceState(badge);
      window.setTimeout(() => setVoiceState('OFF'), 2200);
    }
  };

  // Clean lifecycle on unmount or navigation
  useEffect(() => {
    return () => {
      if (voiceSessionRef.current) {
        console.debug('[Voice] Disconnecting session on mission navigation/unmount');
        voiceSessionRef.current.stop();
        voiceSessionRef.current = null;
      }
    };
  }, [moduleId, missionId]);

  // Next Mission Navigation
  const nextMissionNum = parseInt(mission?.number || '1', 10) + 1;
  const nextMissionId =
    nextMissionNum <= (scenario?.totalMissions || 3)
      ? nextMissionNum.toString().padStart(2, '0')
      : null;

  const handleNextMission = () => {
    if (nextMissionId) {
      navigate(`/mission/${moduleId}/${nextMissionId}`);
    } else {
      navigate('/modules');
    }
  };

  return (
    <SceneView
      moduleId={moduleId}
      missionId={missionId}
      emergency={emergency}
      shaking={shaking}
    >
      {/* ── TOP & TELEMETRY HUD ── */}
      <GameHUD
        moduleTitle={scenario.title}
        missionNumber={mission.number || '01'}
        totalMissions={scenario.totalMissions || 3}
        systemHUD={mission.systemHUD || {}}
        aiState={aiState}
        terminalOpen={terminalOpen}
        onOpenTerminal={() => setTerminalOpen(true)}
      />

      {/* ── LOWER-LEFT NARRATIVE COCKPIT PANEL ── */}
      <div className="mt-auto pb-4">
        <SceneNarrative
          moduleTitle={scenario.title}
          mission={mission}
          onOpenTerminal={() => setTerminalOpen(true)}
        />
      </div>

      {/* ── IMMERSIVE MONACO TERMINAL OVERLAY ── */}
      <TerminalOverlay
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        moduleTitle={scenario.title}
        mission={mission}
        code={code}
        onChangeCode={handleEditorChange}
        output={output}
        running={running}
        onRun={handleRunCode}
        aiState={aiState}
        hintLevel={hintLevel}
        aiMessage={aiMessage}
        onAskAI={handleAskAI}
        askingAI={askingAI}
        voiceState={voiceState}
        onToggleVoice={handleToggleVoice}
        attempts={attempts}
        keystrokes={keystrokes}
      />

      {/* ── MISSION COMPLETION DEBRIEF ── */}
      <MissionDebrief
        open={debriefOpen}
        moduleTitle={scenario.title}
        mission={mission}
        nextMissionId={nextMissionId}
        timeTaken={timeTaken}
        attempts={attempts}
        efficiency={Math.max(65, 100 - (attempts - 1) * 8 - hintLevel * 5)}
        interventions={hintLevel}
        xpEarned={Math.max(100, 250 - (attempts - 1) * 25 - hintLevel * 15)}
        aiDebriefText={mission?.aiResponses?.successDebrief}
        onNextMission={handleNextMission}
        onReturnToDeck={() => navigate('/modules')}
      />
    </SceneView>
  );
}
