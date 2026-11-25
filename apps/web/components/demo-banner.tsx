import { DEMO_READ_ONLY_MESSAGE } from '@/lib/demo';

export function DemoBanner() {
  return (
    <div
      role="status"
      className="border-b-2 border-border bg-primary-400 px-6 py-2 text-center text-sm font-semibold text-ink"
    >
      {DEMO_READ_ONLY_MESSAGE}
    </div>
  );
}
