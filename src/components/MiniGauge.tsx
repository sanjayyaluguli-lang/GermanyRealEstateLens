import type { Status } from "@/lib/calc/engine";

const MARK: Record<Status, string> = {
  green: "var(--good-mark)",
  yellow: "var(--warn-mark)",
  red: "var(--bad-mark)",
};

/** Compact meter: purchase price bar with a tick at the maximum price. */
export function MiniGauge({
  price,
  max,
  status,
  label,
}: {
  price: number;
  max: number | null;
  status: Status;
  label: string;
}) {
  const domain = Math.max(price, max ?? 0, 1) * 1.12;
  const pct = (n: number) => `${Math.min(100, (n / domain) * 100)}%`;
  return (
    <div className="relative h-3 w-full" role="img" aria-label={label} title={label}>
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-2" />
      <div
        className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-r-[4px] rounded-l-full"
        style={{ width: pct(price), background: MARK[status] }}
      />
      {max !== null && <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded bg-ink" style={{ left: pct(max) }} />}
    </div>
  );
}
