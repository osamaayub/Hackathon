/** Brand mark: a bold "H" built from two pillars and a bridge. Kept simple so it stays readable at favicon size. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Hackathon logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hk-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#hk-grad)" />
      <rect x="14" y="14" width="13" height="36" rx="6.5" fill="#fff" />
      <rect x="37" y="14" width="13" height="36" rx="6.5" fill="#fff" />
      <rect x="22" y="26" width="20" height="12" rx="6" fill="#fff" />
    </svg>
  );
}

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {showText && <span className="text-base font-extrabold tracking-tight">Hackathon</span>}
    </span>
  );
}
