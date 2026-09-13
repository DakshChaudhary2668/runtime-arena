/**
 * Shared Game Director Context Builder
 *
 * Exposes a single source of truth for the RunTime Arena AI Game Director.
 * Shared between Text mode (Groq/Ollama/Gemini) and Voice mode (Agora Conversational AI).
 */

export function buildDirectorContext({
  user = null,
  scenario = null,
  mission = null,
  attempts = 0,
  hintLevel = 0,
  lastExecution = null,
}) {
  const playerName = user?.username || user?.name || 'Pilot';
  const moduleId = scenario?.id || mission?.moduleId || 'flight-101';
  const moduleTitle = scenario?.title || 'Flight 101: Systems Failure';
  const missionNumber = mission?.number || '01';
  const missionTitle = mission?.title || 'System Stabilization';
  const concept = mission?.concept || mission?.topic || 'Algorithmic Stabilization';
  const difficulty = mission?.difficulty || 'Normal';
  const objective = mission?.objective || 'Restore mission-critical system stability.';

  let verdict = 'Not yet executed';
  let errorSummary = 'No error telemetry recorded.';
  let passed = false;
  let executionTime = 0;

  if (lastExecution) {
    passed = moduleId === 'flight-101'
      ? lastExecution.passed === true
      : Boolean(lastExecution.passed || lastExecution.status === 'ACCEPTED');
    verdict = passed
      ? 'Verification Succeeded — Output Accepted'
      : (lastExecution.verdict || lastExecution.status || 'Verification Failed');
    errorSummary = moduleId === 'flight-101'
      ? (lastExecution.error_summary || (passed ? 'All server-side cases passed.' : `${lastExecution.testsPassed || 0}/${lastExecution.totalTests || 0} server-side cases passed.`))
      : (lastExecution.error || lastExecution.stderr || (passed ? 'All test cases nominal.' : 'Assertion or runtime fault.'));
    executionTime = lastExecution.time || lastExecution.executionTime || 0;
  }

  const systemHUD = mission?.systemHUD || {};

  return {
    player: {
      name: playerName,
      callsign: `Pilot ${playerName}`,
    },
    mission: {
      moduleId,
      moduleTitle,
      missionId: missionNumber,
      title: missionTitle,
      concept,
      difficulty,
      objective,
    },
    performance: {
      attempts: Number(attempts) || 0,
      hintsUsed: Number(hintLevel) || 0,
      xp: user?.xp || 250,
    },
    execution: {
      verdict,
      errorSummary,
      passed,
      executionTime,
    },
    narrative: {
      system: systemHUD.system || 'Flight Avionics',
      status: systemHUD.status || (passed ? 'Nominal' : 'Critical'),
      subsystem: systemHUD.subsystem || 'Core Loop',
    },
  };
}

export function formatDirectorPrompt(context) {
  const { player, mission, performance, execution, narrative } = context;

  return (
    `[RUNTIME ARENA TELEMETRY & FLIGHT CONTEXT]\n` +
    `Call-sign: ${player.callsign}\n` +
    `Module: ${mission.moduleId} (${mission.moduleTitle})\n` +
    `Mission ${mission.missionId}: ${mission.title}\n` +
    `Objective: ${mission.objective}\n` +
    `Core Concept: ${mission.concept} (Difficulty: ${mission.difficulty})\n` +
    `Active Subsystem: ${narrative.system} [${narrative.status}]\n` +
    `Telemetry:\n` +
    `- Mission Attempts: ${performance.attempts}\n` +
    `- Hint Level Requested: ${performance.hintsUsed} of 3\n` +
    `- Latest Verification: ${execution.verdict}\n` +
    `- Telemetry Error Summary: ${execution.errorSummary}\n\n` +
    `Directives:\n` +
    `1. You are the RunTime Arena AI Game Director. Address the player as '${player.callsign}' or 'Pilot'.\n` +
    `2. Calibrate hint guidance strictly to Hint Level ${performance.hintsUsed}: Level 1 = conceptual direction, Level 2 = algorithmic guidance, Level 3 = near-solution logic.\n` +
    `3. Never recite complete solution code directly.\n` +
    `4. Keep responses punchy, immersive, and tactical.`
  );
}
