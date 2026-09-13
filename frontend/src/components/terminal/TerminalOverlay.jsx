import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import TerminalHeader from './TerminalHeader';
import TerminalConsole from './TerminalConsole';
import AIDirector from '../ai/AIDirector';

function defineRuntimeArenaTheme(monaco) {
  monaco.editor.defineTheme('runtime-arena', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'E6EDF3', background: '070B12' },
      { token: 'comment', foreground: '7EE787', fontStyle: 'italic' },
      { token: 'comment.sql', foreground: '7EE787', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72', fontStyle: 'bold' },
      { token: 'keyword.sql', foreground: 'FF7B72', fontStyle: 'bold' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'string.sql', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'number.sql', foreground: '79C0FF' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'type.sql', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'function.sql', foreground: 'D2A8FF' },
      { token: 'identifier', foreground: 'E6EDF3' },
      { token: 'operator', foreground: '569CD6' },
      { token: 'operator.sql', foreground: '569CD6' },
      { token: 'delimiter', foreground: '8B949E' },
      { token: 'variable', foreground: '79C0FF' },
      { token: 'constant', foreground: '79C0FF' },
    ],
    colors: {
      'editor.background': '#070B12',
      'editor.foreground': '#E6EDF3',
      'editorCursor.foreground': '#00F0FF',
      'editorLineNumber.foreground': '#484F58',
      'editorLineNumber.activeForeground': '#00F0FF',
      'editor.selectionBackground': '#1F3A5F80',
      'editor.inactiveSelectionBackground': '#1F3A5F40',
      'editor.lineHighlightBackground': '#161B2260',
      'editorGutter.background': '#070B12',
      'editorIndentGuide.background1': '#21262D',
      'editorIndentGuide.activeBackground1': '#58A6FF',
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

  const isSql = mission.language === 'sql' || moduleTitle.includes('VAULT') || mission.languageId === 82;
  const editorLanguage = isSql ? 'sql' : (mission.language || 'python');
  const activeFileName = isSql
    ? `vault_breach_m0${mission.number || '1'}.sql`
    : `flight_override_m0${mission.number || '1'}.py`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300">
      {/* Outer Cockpit Terminal Container - 20px border-radius per Design.md */}
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-[#444345] border border-[#E2E2E2] rounded-[20px] overflow-hidden">
        {/* Terminal Title Bar */}
        <TerminalHeader
          moduleTitle={moduleTitle}
          missionNumber={mission.number || '01'}
          activeFile={activeFileName}
          onClose={onClose}
          keystrokes={keystrokes}
        />

        {/* Main Work Area: Left Code Editor, Right Objective & AI Director */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-[#E2E2E2]">
          {/* Left: Monaco Code Editor */}
          <div className="flex-1 h-full min-h-[350px] relative bg-[#070B12]">
            <Editor
              height="100%"
              defaultLanguage={editorLanguage}
              language={editorLanguage}
              beforeMount={defineRuntimeArenaTheme}
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  if (onRun) onRun();
                });
              }}
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
                  {mission.topic || (isSql ? 'SQL MAINFRAME' : 'DSA VERIFICATION')}
                </span>
              </div>

              <div>
                <h3 className="font-mono text-sm font-normal text-white mb-1.5">
                  {mission.title || 'RESTORE SYSTEM'}
                </h3>
                <p className="font-mono text-xs text-[#E2E2E2] leading-relaxed bg-white/5 p-3 rounded-[2px] border-l-2 border-teal-500">
                  {mission.objective || 'Complete the operational query procedure.'}
                </p>
              </div>

              {/* Schema Inspector Panel for SQL Challenges */}
              {mission.publicSchema && mission.publicSchema.length > 0 ? (
                <div className="font-mono text-[11px] space-y-2 text-[#E2E2E2] bg-[#0A0E14] p-3 rounded-[6px] border border-teal-500/30">
                  <div className="flex items-center justify-between text-[10px] text-teal-400 uppercase tracking-wider pb-1 border-b border-teal-500/20">
                    <span>// RELATIONAL SCHEMA</span>
                    <span className="text-[9px] text-neutral-400">READ-ONLY</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {mission.publicSchema.map((tbl) => (
                      <div key={tbl.table} className="bg-black/60 p-2 rounded border border-white/10">
                        <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                          <span>TABLE:</span>
                          <span className="text-white">{tbl.table}</span>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-neutral-300">
                          {tbl.columns.map((col) => (
                            <div key={col.name} className="flex justify-between font-mono">
                              <span className="text-teal-300">{col.name}</span>
                              <span className="text-neutral-400 text-[9px]">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="font-mono text-[11px] space-y-1 text-[#E2E2E2] bg-[#444345]/20 p-2.5 rounded-[2px] border border-[#E2E2E2]">
                  <div className="text-[9px] text-[#E2E2E2] uppercase tracking-wider mb-1">
                    // CRITICAL CONSTRAINTS
                  </div>
                  <div>• Language: Python 3.x</div>
                  <div>• Output: Verified return value / assertions</div>
                  <div>• Auto-sandboxed execution</div>
                </div>
              )}
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
