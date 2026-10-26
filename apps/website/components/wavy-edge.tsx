export function WavyEdge({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={className}
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path d="M0,30 C 360,90 1080,-30 1440,30 L1440,60 L0,60 Z" fill="currentColor" />
    </svg>
  );
}
