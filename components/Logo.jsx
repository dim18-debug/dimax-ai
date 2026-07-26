export default function Logo({ size = 34, withText = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b6fff" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#lg)" opacity="0.18" />
        <rect x="3" y="3" width="42" height="42" rx="12" stroke="url(#lg)" strokeWidth="1.5" />
        <path
          d="M24 12c1.2 3.5 3.3 5.6 6.8 6.8-3.5 1.2-5.6 3.3-6.8 6.8-1.2-3.5-3.3-5.6-6.8-6.8 3.5-1.2 5.6-3.3 6.8-6.8Z"
          fill="url(#lg)"
        />
        <circle cx="32.5" cy="30.5" r="3" fill="url(#lg)" />
        <circle cx="16" cy="31" r="2" fill="url(#lg)" opacity="0.8" />
      </svg>
      {withText && (
        <span className="text-lg font-bold tracking-tight text-white">
          DIM<span className="gradient-text">AX</span>
        </span>
      )}
    </span>
  );
}
