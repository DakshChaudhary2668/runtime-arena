import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import TerminalHeader from './TerminalHeader';
import TerminalConsole from './TerminalConsole';
import AIDirector from '../ai/AIDirector';

function defineRuntimeArenaTheme(monaco) {
  monaco.editor.defineTheme('runtime-arena', {
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: '', foreground: 'E2E2E2', background: '000000' },
      { token: 'comment', foreground: 'B8BAB9' },
      { token: 'keyword', foreground: 'FFFFFF' },
      { token: 'string', foreground: 'E2E2E2' },
      { token: 'number', foreground: 'FFFFFF' },
      { token: 'type', foreground: 'E2E2E2' },
      { token: 'identifier', foreground: 'FFFFFF' },
      { token: 'delimiter', foreground: 'B8BAB9' },
      { token: 'operator', foreground: 'FFFFFF' },
      { token: 'variable', foreground: 'E2E2E2' },
      { token: 'constant', foreground: 'FFFFFF' },
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#E2E2E2',
      'editorCursor.foreground': '#FFFFFF',
      'editorLineNumber.foreground': '#B8BAB9',
      'editorLineNumber.activeForeground': '#FFFFFF',
      'editor.selectionBackground': '#444345',
      'editor.inactiveSelectionBackground': '#444345',
      'editor.lineHighlightBackground': '#44434540',
      'editorGutter.background': '#000000',
      'editorIndentGuide.background1': '#444345',
      'editorIndentGuide.activeBackground1': '#E2E2E2',
    },
  });
}

export default function TerminalOverlay({
  open = false,
  onClose,
  moduleTitle = 'FLIGHT 101',
  mission = {},
  code = '',
  onChangeCode,
  output,
  running = false,
  onRun,
  aiState = 'OBSERVING',
  hintLevel = 0,
  aiMessage = '',
  onAskAI,
  askingAI = false,
  voiceState = 'OFF',
  onToggleVoice,
  attempts = 0,
  keystrokes = 0,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300">
      {/* Outer Cockpit Terminal Container - 20px border-radius per Design.md */}
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-[#444345] border border-[#E2E2E2] rounded-[20px] overflow-hidden">
        {/* Terminal Title Bar */}
        <TerminalHeader
          moduleTitle={moduleTitle}
          missionNumber={mission.number || '01'}
          activeFile={`flight_override_m0${mission.number || '1'}.py`}
          onClose={onClose}
          keystrokes={keystrokes}
        />

        {/* Main Work Area: Left Code Editor, Right Objective & AI Director */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-[#E2E2E2]">
          {/* Left: Monaco Code Editor */}
          <div className="flex-1 h-full min-h-[350px] relative bg-black">
            <Editor
              height="100%"
              defaultLanguage="python"
              language="python"
              beforeMount={defineRuntimeArenaTheme}
              theme="runtime-arena"
              value={code}
              onChange={onChangeCode}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                lineHeight: 20,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'gutter',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                fontLigatures: true,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Right: Mission Context & AI Game Director */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col justify-between p-4 bg-black border-t md:border-t-0 md:border-l border-[#E2E2E2] overflow-y-auto space-y-4">
            {/* Story Objective Callout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E2E2]">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#B8BAB9] uppercase">
                  MISSION DIRECTIVE
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 border border-[#E2E2E2] text-white bg-[#444345] rounded-[2px]">
                  {mission.topic || 'DSA VERIFICATION'}
                </span>
              </div>

              <div>
                <h3 className="font-mono text-sm font-normal text-white mb-1.5">
                  {mission.title || 'RESTORE SYSTEM'}
                </h3>
                <p className="font-mono text-xs text-[#E2E2E2] leading-relaxed bg-white/5 p-3 rounded-[2px] border-l-2 border-[#E2E2E2]">
                  {mission.objective || 'Complete the algorithmic procedure to restore system integrity.'}
                </p>
              </div>

              {/* System Target Specs */}
              <div className="font-mono text-[11px] space-y-1 text-[#E2E2E2] bg-[#444345]/20 p-2.5 rounded-[2px] border border-[#E2E2E2]">
                <div className="text-[9px] text-[#E2E2E2] uppercase tracking-wider mb-1">
                  // CRITICAL CONSTRAINTS
                </div>
                <div>• Language: Python 3.x</div>
                <div>• Output: Verified return value / assertions</div>
                <div>• Auto-sandboxed execution</div>
              </div>
            </div>

            {/* AI Game Director Panel */}
            <AIDirector
              aiState={aiState}
              hintLevel={hintLevel}
              message={aiMessage}
              onAskAI={onAskAI}
              askingAI={askingAI}
              attempts={attempts}
              voiceState={voiceState}
              onToggleVoice={onToggleVoice}
            />
          </div>
        </div>

        {/* Bottom: In-World Flight Computer Console */}
        <TerminalConsole
          output={output}
          running={running}
          onRun={onRun}
          onAskAI={onAskAI}
          onClose={onClose}
          askingAI={askingAI}
        />
      </div>
    </div>
  );
}
