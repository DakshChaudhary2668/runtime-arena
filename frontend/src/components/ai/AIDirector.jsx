import React, { useState } from 'react';
import StatusIndicator from '../common/StatusIndicator';

export default function AIDirector({
  aiState = 'OBSERVING', // 'OBSERVING', 'ATTENTION', 'INTERVENTION', 'RECOVERY', 'RESOLVED'
  hintLevel = 0,
  message = '',
  onAskAI,
  askingAI = false,
  attempts = 0,
  voiceState = 'OFF',
  onToggleVoice,
}) {
  const [question, setQuestion] = useState('');
  const getStatusConfig = () => {
    switch (aiState) {
      case 'INTERVENTION':
        return { status: 'critical', color: '#FF453A' };
      case 'ATTENTION':
        return { status: 'warning', color: '#FFD60A' };
      case 'RECOVERY':
      case 'RESOLVED':
        return { status: 'nominal', color: '#30D158' };
      default:
        return { status: 'system', color: '#E2E2E2' };
    }
  };

  const statusConfig = getStatusConfig();
  const voiceBusy = voiceState === 'CONNECTING';
  const voiceActive = ['LISTENING', 'SPEAKING', 'THINKING', 'MUTED'].includes(voiceState);

  const submitQuestion = (event) => {
    event.preventDefault();
    onAskAI?.(question.trim());
    setQuestion('');
  };

  return (
    <div className="flex flex-col bg-[#444345]/20 border border-[#E2E2E2] rounded-[10px] p-4 backdrop-blur-xl min-w-[260px] max-w-[340px]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E2E2]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8BAB9] font-normal">
            AI GAME DIRECTOR
          </span>
        </div>
        <StatusIndicator
          status={statusConfig.status}
          label={aiState}
          pulse={false}
          color={statusConfig.color}
        />
      </div>

      {/* AI Telemetry status message */}
      <div className="mb-3 font-mono text-xs text-[#E2E2E2] leading-relaxed min-h-[50px] bg-white/5 p-2.5 rounded-[2px] border-l-2 border-[#E2E2E2]">
        {message ||
          (aiState === 'OBSERVING'
            ? 'Player code telemetry nominal. Monitoring execution vectors.'
            : aiState === 'ATTENTION'
            ? 'Struggle detected. Code failed verification harness.'
            : aiState === 'INTERVENTION'
            ? 'Contextual intervention deployed to prevent mission failure.'
            : 'System stability restored. Telemetry verified.')}
      </div>

      {/* Telemetry & Hint Level Bar */}
      <div className="flex items-center justify-between font-mono text-[10px] text-[#B8BAB9] mb-3">
        <span>ATTEMPTS: {attempts}</span>
        <span>HINT LEVEL: 0{hintLevel}</span>
      </div>

      {/* Text remains the canonical input and voice is an optional transport. */}
      <form onSubmit={submitQuestion} className="space-y-2">
        <label className="sr-only" htmlFor="director-question">Ask the AI Director</label>
        <input
          id="director-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="ASK ABOUT THE ACTIVE SYSTEM..."
          className="w-full rounded-[2px] border border-[#E2E2E2] bg-[#444345] px-3 py-2 font-mono text-[10px] text-white placeholder:text-[#B8BAB9] outline-none focus:border-white"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            disabled={askingAI}
            type="submit"
            className="rt-control flex items-center justify-center gap-2 px-3 py-2 text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:text-[#B8BAB9] disabled:border-[#B8BAB9] disabled:opacity-100"
          >
            {askingAI ? 'ANALYZING TELEMETRY...' : '⚡ REQUEST SYSTEM HINT'}
          </button>
          <button
            onClick={onToggleVoice}
            disabled={voiceBusy}
            type="button"
            aria-pressed={voiceActive}
            aria-label={voiceActive ? 'Mute or resume voice link' : 'Enable Agora voice link'}
            title="Optional Agora voice link"
            className="rt-control min-w-12 px-3 py-2 font-mono text-[11px] text-white disabled:text-[#B8BAB9]"
          >
            {voiceBusy ? '…' : voiceState === 'MUTED' ? 'MIC×' : voiceActive ? 'MIC●' : 'MIC'}
          </button>
        </div>
      </form>

      <div className="mt-2 flex justify-between items-center font-mono text-[9px] tracking-wider text-[#B8BAB9]">
        <span>HINT COST: -15 XP</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              voiceState === 'LISTENING'
                ? 'bg-[#30D158] animate-pulse'
                : voiceState === 'SPEAKING'
                ? 'bg-[#0A84FF] animate-pulse'
                : voiceState === 'THINKING'
                ? 'bg-[#FFD60A] animate-pulse'
                : voiceState === 'CONNECTING'
                ? 'bg-[#FF9F0A] animate-pulse'
                : voiceState === 'MUTED'
                ? 'bg-[#FF453A]'
                : voiceState === 'OFF'
                ? 'bg-[#636366]'
                : 'bg-[#FF453A]'
            }`}
          />
          VOICE: {voiceState}
        </span>
      </div>
    </div>
  );
}
