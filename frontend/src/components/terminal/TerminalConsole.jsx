import React from 'react';
import Button from '../common/Button';

export default function TerminalConsole({
  output,
  running,
  onRun,
  onAskAI,
  onClose,
  askingAI = false,
}) {
  // Translate raw system execution results into immersive in-game diagnostics
  // ACCENT COLORS RESTRICTED TO LABEL/VALUE TEXT ONLY - NO COLORED BACKGROUND WASH
  const renderDiagnostic = () => {
    if (!output) {
      return (
        <div className="font-mono text-xs text-[#B8BAB9]">
          <span className="text-[#E2E2E2]">&gt;</span> Terminal idle. Write code and execute verification sequence.
        </div>
      );
    }

    const isSuccess =
      output.status === 'Accepted' &&
      (!output.stderr || output.stderr.trim() === '');
    const isRuntimeError =
      output.status === 'Runtime Error' ||
      output.status === 'Error' ||
      (output.stderr && output.stderr.includes('Error'));

    if (isSuccess) {
      return (
        <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
          {/* Accent on diagnostic label text only */}
          <div className="font-normal flex items-center gap-2 text-[#30D158]">
            <span>✓</span>
            <span className="tracking-wider">SYSTEM RESTORED // SEQUENCE VERIFIED</span>
          </div>
          <p className="text-[11px] text-[#B8BAB9] mt-1">
            Execution nominal ({output.time}s, {output.memory}KB). Life support and fuel channels stabilized.
          </p>
        </div>
      );
    }

    if (isRuntimeError) {
      return (
        <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
          {/* Accent on diagnostic label text only */}
          <div className="font-normal flex items-center gap-2 text-[#FF453A]">
            <span>✖</span>
            <span className="tracking-wider">EXECUTION INTERRUPTED // FAULT ISOLATED</span>
          </div>
          <p className="text-[11px] text-[#B8BAB9] mt-1">
            Runtime exception detected in flight computer. The mission remains active. Correct the fault and retry.
          </p>
        </div>
      );
    }

    // Wrong answer / Logic assertion failure
    return (
      <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
        {/* Accent on diagnostic label text only */}
        <div className="font-normal flex items-center gap-2 text-[#FFD60A]">
          <span>▲</span>
          <span className="tracking-wider">SYSTEM REJECTED // VERIFICATION FAILED</span>
        </div>
        <p className="text-[11px] text-[#B8BAB9] mt-1">
          Output sequence does not match required telemetry. Review the pointer logic and retry.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-black border-t border-[#E2E2E2] p-4 select-none">
      {/* Console Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E2E2] font-mono text-[10px] text-[#B8BAB9] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>FLIGHT COMPUTER DIAGNOSTIC LOG</span>
        </div>
        {output && (
          <div className="flex items-center gap-3 text-[10px]">
            <span>TIME: {output.time}s</span>
            <span>MEM: {output.memory}KB</span>
          </div>
        )}
      </div>

      {/* Console Output Area */}
      <div className="h-28 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 select-text">
        {running ? (
          <div className="flex items-center gap-2 text-[#E2E2E2] py-2">
            <span className="w-3.5 h-3.5 border-2 border-[#E2E2E2] border-t-transparent rounded-full animate-spin" />
            <span>TRANSMITTING CODE TO COCKPIT COMPUTER...</span>
          </div>
        ) : (
          <>
            {renderDiagnostic()}
            {output?.stdout && (
              <pre className="text-white whitespace-pre-wrap font-mono text-[11px] bg-[#444345]/20 p-2.5 rounded-[2px] border border-[#E2E2E2]">
                {output.stdout}
              </pre>
            )}
            {output?.stderr && (
              <pre className="text-[#FF453A] whitespace-pre-wrap font-mono text-[11px] bg-[#444345]/20 p-2.5 rounded-[2px] border border-[#E2E2E2]">
                {output.stderr}
              </pre>
            )}
          </>
        )}
      </div>

      {/* Terminal Action Buttons */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E2E2E2]">
        <div className="flex items-center gap-3">
          <Button
            onClick={onRun}
            loading={running}
            variant="primary"
            shortcut="CTRL+ENTER"
          >
            EXECUTE VERIFICATION
          </Button>

          <Button
            onClick={onAskAI}
            loading={askingAI}
            variant="secondary"
          >
            ASK AI DIRECTOR
          </Button>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="rt-control px-3 py-2 font-mono text-xs text-white transition-colors cursor-pointer"
        >
          RETURN TO SCENE [ESC]
        </button>
      </div>
    </div>
  );
}
