import React from 'react';

export default function StatusIndicator({
  status = 'nominal', // 'nominal', 'warning', 'critical', 'system', 'active'
  label,
  pulse = true,
  className = '',
  color = '#E2E2E2',
}) {
  const configs = {
    nominal: {
      defaultLabel: 'SYSTEM NOMINAL',
      icon: '●',
    },
    warning: {
      defaultLabel: 'ATTENTION REQUIRED',
      icon: '▲',
    },
    critical: {
      defaultLabel: 'CRITICAL EMERGENCY',
      icon: '✖',
    },
    system: {
      defaultLabel: 'AI ONLINE',
      icon: '◆',
    },
    idle: {
      defaultLabel: 'STANDBY',
      icon: '○',
    },
  };

  const config = configs[status.toLowerCase()] || configs.nominal;

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[11px] tracking-wider rounded-[2px] bg-[#444345] border border-[#E2E2E2] select-none ${className}`}
    >
      <span
        className={`text-[9px] ${pulse && status === 'critical' ? 'animate-ping' : ''}`}
        style={{ color }}
      >
        {config.icon}
      </span>
      <span
        className="font-normal tracking-[0.1em]"
        style={{ color }}
      >
        {label || config.defaultLabel}
      </span>
    </div>
  );
}
