const MESSAGES = [
  '100% Self-Hosted',
  'Free to Install, Free to Get Hosted',
  'Your School, Your Data',
  'Open Source Forever',
  'No Per-Student Fees, Ever',
];

export function TickerBar() {
  const track = [...MESSAGES, ...MESSAGES];

  return (
    <div className="flex h-10 items-center overflow-hidden bg-blue-500 text-cream">
      <div className="flex shrink-0 animate-ticker items-center whitespace-nowrap">
        {track.map((message, index) => (
          <span key={index} className="flex items-center text-sm font-extrabold">
            <span className="px-4">{message}</span>
            <span aria-hidden className="text-primary-400">
              &middot;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
