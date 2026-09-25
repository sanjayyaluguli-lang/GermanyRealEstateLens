"use client";

import { useEffect, useRef, useState } from "react";
import type { CalcInputs, CalcResults, ProjectionYear, Status } from "@/lib/calc/engine";
import { fill, formatEur, formatEurShort, getDictionary, type Lang } from "@/lib/i18n";

// Chart rules (see the dataviz notes in CLAUDE.md): series colours are the
// validated blue/orange pair, status colours only carry state, text always
// uses ink tokens, bars are ≤ 24px with a 4px rounded data-end, lines 2px.

const STATUS_MARK: Record<Status, string> = {
  green: "var(--good-mark)",
  yellow: "var(--warn-mark)",
  red: "var(--bad-mark)",
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// ------------------------------------------------------------ price gauge

/** Meter: purchase price against the maximum price for the goal. */
export function PriceGauge({ lang, inputs, r }: { lang: Lang; inputs: CalcInputs; r: CalcResults }) {
  const t = getDictionary(lang).viz;
  const eur = (n: number) => formatEur(n, lang);
  const price = inputs.purchasePrice;
  const max = r.maxPurchasePrice;

  let note: string;
  if (r.maxPurchasePriceUnbounded) note = t.gaugeUnbounded;
  else if (max === null) note = t.gaugeNone;
  else if (price <= max) note = fill(t.gaugeRoom, { amount: eur(max - price) });
  else note = fill(t.gaugeOver, { amount: eur(price - max) });

  const domain = Math.max(price, max ?? 0, 1) * 1.12;
  const pct = (n: number) => `${Math.min(100, (n / domain) * 100)}%`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-2">{t.gaugeTitle}</p>
      </div>
      <div className="relative h-7" role="img" aria-label={`${t.gaugePrice} ${eur(price)}, ${t.gaugeMax} ${max === null ? "—" : eur(max)}`}>
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-surface-2" />
        <div
          className="absolute top-1/2 left-0 h-3 -translate-y-1/2 rounded-r-[4px] rounded-l-full transition-[width] duration-300"
          style={{ width: pct(price), background: STATUS_MARK[r.status] }}
        />
        {max !== null && (
          <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded bg-ink" style={{ left: pct(max) }} />
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: STATUS_MARK[r.status] }} aria-hidden />
          {t.gaugePrice} <span className="num font-semibold">{eur(price)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 rounded bg-ink" aria-hidden />
          {t.gaugeMax}{" "}
          <span className="num font-semibold">
            {r.maxPurchasePriceUnbounded ? "∞" : max === null ? "—" : eur(max)}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted">{note}</p>
    </div>
  );
}

// ------------------------------------------------------ monthly waterfall

interface Step {
  key: string;
  label: string;
  from: number;
  to: number;
  kind: "income" | "outflow" | "result";
}

/** Horizontal waterfall from cold rent down to monthly cash flow. */
export function MonthlyBreakdown({ lang, inputs, r }: { lang: Lang; inputs: CalcInputs; r: CalcResults }) {
  const t = getDictionary(lang).viz;
  const [hover, setHover] = useState<string | null>(null);

  const rent = inputs.monthlyColdRent;
  const vacancy = rent - r.effectiveMonthlyRent;
  const outflows: [string, string, number][] = [
    ["vacancy", t.mVacancy, vacancy],
    ["costs", t.mCosts, r.monthlyOperatingCosts],
    ["interest", t.mInterest, r.monthlyInterest],
    ["repayment", t.mRepayment, r.monthlyRepayment],
  ];
  const steps: Step[] = [{ key: "rent", label: t.mRent, from: 0, to: rent, kind: "income" }];
  let running = rent;
  for (const [key, label, amount] of outflows) {
    if (amount <= 0) continue;
    steps.push({ key, label, from: running, to: running - amount, kind: "outflow" });
    running -= amount;
  }
  steps.push({ key: "result", label: t.mResult, from: 0, to: r.monthlyCashflow, kind: "result" });

  const lo = Math.min(0, ...steps.map((s) => Math.min(s.from, s.to)));
  const hi = Math.max(1, ...steps.map((s) => Math.max(s.from, s.to)));
  const span = hi - lo;
  const x = (v: number) => ((v - lo) / span) * 100;
  const zero = x(0);

  const colour = (s: Step) =>
    s.kind === "income"
      ? "var(--series-1)"
      : s.kind === "outflow"
        ? "var(--series-2)"
        : s.to >= 0
          ? "var(--good-mark)"
          : "var(--bad-mark)";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="h2 text-base">{t.monthlyTitle}</h3>
        <p className="text-xs text-muted">{t.monthlySub}</p>
      </div>
      <ul className="grid gap-1" onMouseLeave={() => setHover(null)}>
        {steps.map((s) => {
          const left = Math.min(x(s.from), x(s.to));
          const width = Math.max(0.6, Math.abs(x(s.to) - x(s.from)));
          const negative = s.to < s.from;
          const amount = s.kind === "result" ? s.to : s.to - s.from;
          return (
            <li
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              className={`grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_5.5rem] items-center gap-3 rounded-md px-1.5 py-1 text-[13px] transition-colors ${
                hover === s.key ? "bg-surface-2" : ""
              } ${s.kind === "result" ? "mt-1 border-t border-line pt-2 font-semibold" : ""}`}
            >
              <span className="truncate text-ink-2" title={s.label}>
                {s.label}
              </span>
              <span className="relative h-5">
                <span className="absolute inset-y-0 w-px bg-line-strong" style={{ left: `${zero}%` }} aria-hidden />
                <span
                  className={`absolute top-1/2 h-3.5 -translate-y-1/2 ${negative ? "rounded-l-[4px]" : "rounded-r-[4px]"}`}
                  style={{ left: `${left}%`, width: `${width}%`, background: colour(s) }}
                  aria-hidden
                />
              </span>
              <span className="num text-right">{formatEur(amount, lang)}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-4 rounded-sm" style={{ background: "var(--series-1)" }} aria-hidden />
          {t.mRent}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-4 rounded-sm" style={{ background: "var(--series-2)" }} aria-hidden />
          {t.mCosts} / {t.mInterest} / {t.mRepayment}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------- projection chart

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

/** Two series over 30 years: property value (blue) and remaining debt (orange). */
export function ProjectionChart({
  lang,
  inputs,
  r,
}: {
  lang: Lang;
  inputs: CalcInputs;
  r: CalcResults;
}) {
  const t = getDictionary(lang).viz;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const points: Pick<ProjectionYear, "year" | "propertyValue" | "remainingDebt" | "equityInProperty">[] = [
    { year: 0, propertyValue: inputs.purchasePrice, remainingDebt: r.loanAmount, equityInProperty: inputs.purchasePrice - r.loanAmount },
    ...r.projection,
  ];

  const height = 260;
  const m = { top: 16, right: width < 520 ? 16 : 118, bottom: 30, left: 64 };
  const w = Math.max(0, width - m.left - m.right);
  const h = height - m.top - m.bottom;
  const yMax = niceMax(Math.max(...points.map((p) => Math.max(p.propertyValue, p.remainingDebt))));
  const xs = (year: number) => m.left + (year / 30) * w;
  const ys = (v: number) => m.top + h - (v / yMax) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const short = (n: number) => formatEurShort(n, lang);
  const eur = (n: number) => formatEur(n, lang);

  const line = (key: "propertyValue" | "remainingDebt") =>
    points.map((p, i) => `${i ? "L" : "M"}${xs(p.year).toFixed(1)},${ys(p[key]).toFixed(1)}`).join("");
  const equityArea =
    points.map((p, i) => `${i ? "L" : "M"}${xs(p.year).toFixed(1)},${ys(p.propertyValue).toFixed(1)}`).join("") +
    [...points].reverse().map((p) => `L${xs(p.year).toFixed(1)},${ys(p.remainingDebt).toFixed(1)}`).join("") +
    "Z";

  const last = points[points.length - 1];
  const fixedEnd = inputs.fixedRateYears <= 30 ? inputs.fixedRateYears : null;
  const hp = hover === null ? null : points[hover];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const year = Math.round(((e.clientX - rect.left) / rect.width) * 30);
    setHover(Math.max(0, Math.min(30, year)));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="h2 text-base">{t.chartTitle}</h3>
          <p className="text-xs text-muted">{t.chartSub}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-1)" }} aria-hidden />
            {t.chartValue}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0.5 w-4 rounded" style={{ background: "var(--series-2)" }} aria-hidden />
            {t.chartDebt}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-4 rounded-sm" style={{ background: "var(--series-1-wash)" }} aria-hidden />
            {t.chartEquity}
          </span>
        </div>
      </div>

      <div ref={ref} className="relative w-full">
        {width > 0 && (
          <svg width={width} height={height} className="block overflow-visible" role="img" aria-label={t.chartTitle}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={m.left} x2={m.left + w} y1={ys(v)} y2={ys(v)} stroke="var(--line)" strokeWidth={1} />
                <text x={m.left - 10} y={ys(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)" className="num">
                  {short(v)}
                </text>
              </g>
            ))}
            {[0, 5, 10, 15, 20, 25, 30].map((yr) => (
              <text key={yr} x={xs(yr)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--muted)" className="num">
                {yr}
              </text>
            ))}

            {fixedEnd !== null && (
              <g>
                <line x1={xs(fixedEnd)} x2={xs(fixedEnd)} y1={m.top} y2={m.top + h} stroke="var(--line-strong)" strokeWidth={1} />
                <text x={xs(fixedEnd) + 6} y={m.top + 10} fontSize={11} fill="var(--ink-2)">
                  {t.chartFixedEnd}
                </text>
              </g>
            )}

            <path d={equityArea} fill="var(--series-1-wash)" />
            <path d={line("propertyValue")} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={line("remainingDebt")} fill="none" stroke="var(--series-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* End markers + direct labels (hidden on narrow screens; legend + tooltip carry it) */}
            {[
              { key: "propertyValue" as const, colour: "var(--series-1)", label: t.chartValue },
              { key: "remainingDebt" as const, colour: "var(--series-2)", label: t.chartDebt },
            ].map(({ key, colour, label }) => (
              <g key={key}>
                <circle cx={xs(30)} cy={ys(last[key])} r={4.5} fill={colour} stroke="var(--surface)" strokeWidth={2} />
                {m.right > 40 && (
                  <text x={xs(30) + 10} y={ys(last[key])} dy="0.32em" fontSize={11} fill="var(--ink-2)">
                    <tspan className="num" fontWeight={600} fill="var(--ink)">
                      {short(last[key])}
                    </tspan>
                    <tspan x={xs(30) + 10} dy="1.25em">
                      {label}
                    </tspan>
                  </text>
                )}
              </g>
            ))}

            {hp && (
              <g pointerEvents="none">
                <line x1={xs(hp.year)} x2={xs(hp.year)} y1={m.top} y2={m.top + h} stroke="var(--ink-2)" strokeWidth={1} />
                <circle cx={xs(hp.year)} cy={ys(hp.propertyValue)} r={4.5} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
                <circle cx={xs(hp.year)} cy={ys(hp.remainingDebt)} r={4.5} fill="var(--series-2)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}

            <rect
              x={m.left}
              y={m.top}
              width={w}
              height={h}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}

        {hp && width > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-line bg-surface p-3 text-xs"
            style={{
              boxShadow: "var(--shadow)",
              left: Math.min(Math.max(xs(hp.year) + 12, 0), width - 216),
            }}
          >
            <p className="mb-1.5 font-semibold text-ink">{fill(t.chartYear, { n: String(hp.year) })}</p>
            {[
              [t.chartValue, hp.propertyValue, "var(--series-1)"],
              [t.chartDebt, hp.remainingDebt, "var(--series-2)"],
              [t.chartEquity, hp.equityInProperty, "var(--series-1-wash)"],
            ].map(([label, v, c]) => (
              <p key={label as string} className="flex items-center justify-between gap-3 py-0.5">
                <span className="flex items-center gap-1.5 text-ink-2">
                  <i className="inline-block size-2.5 rounded-sm" style={{ background: c as string }} aria-hidden />
                  {label}
                </span>
                <span className="num text-ink">{eur(v as number)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
