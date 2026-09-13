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
          <span className="text-[#E2E2E2]">&gt;</span> Terminal idle. Write query / code and execute verification sequence.
        </div>
      );
    }

    if (output.publicTests && output.hiddenTests) {
      const publicCases = output.publicTests.results || [];
      const hiddenCases = output.hiddenTests.results || [];
      return (
        <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2 text-[#E2E2E2]">
          <div className={output.passed ? 'text-[#30D158]' : 'text-[#FFD60A]'}>
            {output.passed
              ? '✓ VERIFICATION ACCEPTED'
              : `▲ ${output.verdict_label || (output.status ? output.status.replaceAll('_', ' ') : 'VERIFICATION FAILED')}`}
          </div>
          <p className="mt-1">CASES: {output.testsPassed}/{output.totalTests} passed · PUBLIC: {output.publicTests.passed}/{output.publicTests.total} · HIDDEN: {output.hiddenTests.passed}/{output.hiddenTests.total}</p>
          {output.error_summary && <p className="mt-1 text-[#FF453A]">{output.error_summary}</p>}
          {publicCases.map((test) => (
            <div key={test.name} className="mt-1">
              {test.passed ? '✓' : '✗'} {test.name}
              {!test.passed && test.expected !== undefined && <span> — expected {test.expected}, received {test.received}</span>}
              {!test.passed && test.error && <span> — {test.error}</span>}
            </div>
          ))}
          {hiddenCases.map((test) => (
            <div key={test.name} className="mt-1">{test.passed ? '✓' : '✗'} {test.name}</div>
          ))}
        </div>
      );
    }

    const isSuccess =
      output.status === 'Accepted' &&
      (!output.stderr || output.stderr.trim() === '');
    const isRejected = output.error_type === 'QUERY_REJECTED' || (output.stderr && output.stderr.includes('QUERY REJECTED'));
    const isTimeout = output.error_type === 'QUERY_TIMEOUT' || output.status === 'Time Limit Exceeded';
    const isSyntax = output.error_type === 'SQL_SYNTAX_ERROR';
    const isMismatch = output.error_type === 'WRONG_RESULT' || output.status === 'Wrong Answer';
    const isRuntimeError =
      output.status === 'Runtime Error' ||
      output.status === 'Error' ||
      (output.stderr && output.stderr.includes('Error'));

    if (isSuccess) {
      return (
        <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
          <div className="font-normal flex items-center gap-2 text-[#30D158]">
            <span>✓</span>
            <span className="tracking-wider">VERIFIED // OPERATION ACCEPTED</span>
          </div>
          <p className="text-[11px] text-[#B8BAB9] mt-1">
            Execution nominal ({output.time}s, {output.memory}KB). Telemetry and result records validated.
          </p>
        </div>
      );
    }

    if (isRejected) {
      return (
        <div className="p-3 bg-red-950/30 border border-red-500/50 font-mono text-xs rounded-[2px] mb-2">
          <div className="font-bold flex items-center gap-2 text-[#FF453A]">
            <span>🛑</span>
            <span className="tracking-wider">QUERY REJECTED // SECURITY POLICY INTERVENTION</span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1">
            {output.stderr || 'Unauthorized query statement detected. Write and administrative operations are strictly forbidden.'}
          </p>
        </div>
      );
    }

    if (isTimeout) {
      return (
        <div className="p-3 bg-amber-950/30 border border-amber-500/50 font-mono text-xs rounded-[2px] mb-2">
          <div className="font-bold flex items-center gap-2 text-[#FFD60A]">
            <span>⏱</span>
            <span className="tracking-wider">QUERY TIMEOUT // EXECUTION LIMIT EXCEEDED</span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1">
            {output.stderr || 'Query exceeded maximum execution operations threshold. Avoid runaway joins or infinite recursive CTEs.'}
          </p>
        </div>
      );
    }

    if (isSyntax) {
      return (
        <div className="p-3 bg-amber-950/30 border border-amber-500/50 font-mono text-xs rounded-[2px] mb-2">
          <div className="font-bold flex items-center gap-2 text-[#FFD60A]">
            <span>▲</span>
            <span className="tracking-wider">SYNTAX ERROR // MALFORMED STATEMENT</span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1">
            {output.stderr || 'SQL parser encountered a syntax error. Verify your table names, column aliases, and clause structure.'}
          </p>
        </div>
      );
    }

    if (isMismatch) {
      return (
        <div className="p-3 bg-amber-950/30 border border-amber-500/50 font-mono text-xs rounded-[2px] mb-2">
          <div className="font-bold flex items-center gap-2 text-[#FFD60A]">
            <span>▲</span>
            <span className="tracking-wider">RESULT MISMATCH // VERIFICATION FAILED</span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-1">
            {output.stderr || 'Output record set does not match required mission objectives. Check your filters, joins, and sorting.'}
          </p>
        </div>
      );
    }

    if (isRuntimeError) {
      return (
        <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
          <div className="font-normal flex items-center gap-2 text-[#FF453A]">
            <span>✖</span>
            <span className="tracking-wider">EXECUTION INTERRUPTED // FAULT ISOLATED</span>
          </div>
          <p className="text-[11px] text-[#B8BAB9] mt-1">
            Runtime exception detected. Correct the fault and retry.
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-[#444345]/20 border border-[#E2E2E2] font-mono text-xs rounded-[2px] mb-2">
        <div className="font-normal flex items-center gap-2 text-[#FFD60A]">
          <span>▲</span>
          <span className="tracking-wider">SYSTEM REJECTED // VERIFICATION FAILED</span>
        </div>
        <p className="text-[11px] text-[#B8BAB9] mt-1">
          Output sequence does not match required telemetry.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-black border-t border-[#E2E2E2] p-4 select-none">
      {/* Console Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E2E2] font-mono text-[10px] text-[#B8BAB9] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span>OPERATIONAL DIAGNOSTIC LOG &amp; QUERY OUTPUT</span>
        </div>
        {output && (
          <div className="flex items-center gap-3 text-[10px]">
            <span>TIME: {output.time}s</span>
            <span>MEM: {output.memory}KB</span>
          </div>
        )}
      </div>

      {/* Console Output Area */}
      <div className="h-32 overflow-y-auto font-mono text-xs space-y-2 pr-2 select-text">
        {running ? (
          <div className="flex items-center gap-2 text-[#E2E2E2] py-2">
            <span className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span>TRANSMITTING QUERY TO ISOLATED MAINFRAME SANDBOX...</span>
          </div>
        ) : (
          <>
            {renderDiagnostic()}

            {/* Structured Table for SQL Results */}
            {output?.columns && output.columns.length > 0 && output.rows && (
              <div className="overflow-x-auto my-2 border border-teal-500/30 rounded bg-[#070B12] p-2">
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                  // MAINFRAME QUERY RESULT ({output.rows.length} row{output.rows.length !== 1 ? 's' : ''})
                </div>
                <table className="min-w-full text-left text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-teal-500/30 text-teal-300">
                      {output.columns.map((col, idx) => (
                        <th key={idx} className="py-1 px-2 font-bold uppercase">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {output.rows.slice(0, 20).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-white/5 hover:bg-teal-500/5">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-1 px-2 text-white">
                            {cell !== null ? String(cell) : <span className="text-neutral-500 italic">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Plain stdout fallback if no columns/rows */}
            {output?.stdout && (!output?.columns || output.columns.length === 0) && (
              <pre className="text-white whitespace-pre-wrap font-mono text-[11px] bg-[#444345]/20 p-2.5 rounded-[2px] border border-[#E2E2E2]">
                {output.stdout}
              </pre>
            )}

            {output?.stderr && output.error_type !== 'QUERY_REJECTED' && output.error_type !== 'SQL_SYNTAX_ERROR' && output.error_type !== 'WRONG_RESULT' && (
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
            loadingText="VERIFYING..."
            disabled={running}
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
