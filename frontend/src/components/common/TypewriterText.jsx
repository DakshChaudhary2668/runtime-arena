import React, { useState, useEffect } from 'react';

export default function TypewriterText({
  lines = [],
  speed = 22,
  onComplete,
  className = '',
}) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Reset if lines array changes
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsDone(false);
  }, [JSON.stringify(lines)]);

  useEffect(() => {
    if (!lines || lines.length === 0) return;

    if (currentLineIndex >= lines.length) {
      setIsDone(true);
      if (onComplete) onComplete();
      return;
    }

    const targetLine = lines[currentLineIndex];

    if (currentCharIndex < targetLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const copy = [...prev];
          copy[currentLineIndex] = (copy[currentLineIndex] || '') + targetLine[currentCharIndex];
          return copy;
        });
        setCurrentCharIndex((c) => c + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      // Pause slightly between lines
      const pause = setTimeout(() => {
        setCurrentLineIndex((l) => l + 1);
        setCurrentCharIndex(0);
      }, 160);
      return () => clearTimeout(pause);
    }
  }, [currentLineIndex, currentCharIndex, lines, speed, onComplete]);

  // Click to skip typewriter and reveal all immediately
  function handleSkip() {
    if (!isDone) {
      setDisplayedLines(lines);
      setIsDone(true);
      if (onComplete) onComplete();
    }
  }

  return (
    <div
      onClick={handleSkip}
      className={`cursor-pointer select-none ${className}`}
      title="Click to reveal all text"
    >
      {displayedLines.map((line, idx) => (
        <p
          key={idx}
          className={`${
            idx === 0
              ? 'text-lg sm:text-xl font-bold tracking-wider text-white mb-2'
              : 'text-sm sm:text-base text-[#B8BAB9] leading-relaxed mb-1.5'
          }`}
        >
          {line}
          {idx === currentLineIndex && !isDone && (
            <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse align-middle" />
          )}
        </p>
      ))}
      {!isDone && (
        <span className="inline-block mt-2 text-[10px] font-mono text-[#B8BAB9] uppercase tracking-widest">
          [Click narrative to skip reveal]
        </span>
      )}
    </div>
  );
}
