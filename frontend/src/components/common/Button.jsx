import React from 'react';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  shortcut,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  title,
}) {
  const base =
    'relative inline-flex items-center justify-center gap-3 bg-[#444345] text-white border border-[#E2E2E2] font-mono text-xs uppercase tracking-[0.15em] transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E2E2E2] hover:border-white active:scale-[0.98] disabled:bg-[#444345] disabled:text-[#B8BAB9] disabled:border-[#B8BAB9] disabled:opacity-100 disabled:cursor-not-allowed disabled:pointer-events-none rounded-[2px]';

  const variants = {
    // Primary: pressed-in Charcoal surface with crisp Frost border.
    primary:
      'font-normal px-6 py-2.5 rounded-[2px]',
    // Secondary: Dark technical terminal button
    secondary:
      'px-5 py-2.5 rounded-[2px]',
    // Danger actions remain monochrome; semantic color is reserved for telemetry labels.
    danger:
      'px-5 py-2.5 rounded-[2px]',
    // System: Technical action button (Monochrome Frost/Charcoal)
    system:
      'px-5 py-2.5 rounded-[2px]',
    // Ghost remains a visibly bounded control at rest.
    ghost:
      'px-4 py-2 rounded-[2px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING...</span>
        </span>
      ) : (
        <>
          <span>{children}</span>
          {shortcut && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono tracking-widest bg-[#444345] text-white border border-[#E2E2E2] rounded-[2px]">
              [{shortcut}]
            </span>
          )}
        </>
      )}
    </button>
  );
}
