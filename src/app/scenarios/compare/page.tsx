import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiniGauge } from "@/components/MiniGauge";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland } from "@/lib/calc/regions";
import type { Scenario } from "@/lib/data/scenarios";
import { getScenarios } from "@/lib/data/scenarios";
import { formatEur, formatNum } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

const UUID = /^[0-9a-f-]{36}$/i;

type Row = {
  label: string;
  cell: (s: Scenario) => React.ReactNode;
  /** When set, the best scenario for this row is highlighted. */
  score?: (s: Scenario) => number | null;
  better?: "high" | "low";
};

export default async function ComparePage({ searchParams }: PageProps<"/scenarios/compare">) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : [];
  const ids = [...new Set(raw.filter((id) => UUID.test(id)))].slice(0, 4);
  const [{ t, lang }, scenarios] = await Promise.all([getT(), getScenarios(user.id, ids)]);
  const eur = (n: number | null) => formatEur(n, lang);
  const pct = (n: number | null) => (n === null ? "—" : `${formatNum(n, lang, 2)} %`);

  const groups: [string, Row[]][] = [
    [
      t.calc.sectionProperty,
      [
        { label: t.calc.bundesland, cell: (s) => getBundesland(s.inputs.bundesland)?.name },
        { label: t.calc.purchasePrice, cell: (s) => eur(s.inputs.purchasePrice) },
        { label: t.calc.livingArea, cell: (s) => formatNum(s.inputs.livingArea, lang, 0) },
        { label: t.calc.monthlyColdRent, cell: (s) => eur(s.inputs.monthlyColdRent) },
      ],
    ],
    [
      t.calc.sectionFinancing,
      [
        { label: t.calc.goal, cell: (s) => t.goals[s.inputs.goal] },
        { label: t.calc.equity, cell: (s) => eur(s.inputs.equity) },
        { label: t.calc.interestRatePct, cell: (s) => pct(s.inputs.interestRatePct) },
        { label: t.calc.repaymentRatePct, cell: (s) => pct(s.inputs.repaymentRatePct) },
      ],
    ],
    [
      t.calc.results,
      [
        {
          label: t.calc.maxPurchasePrice,
          cell: (s) => eur(s.results.maxPurchasePrice),
          score: (s) => (s.results.maxPurchasePrice === null ? null : s.results.maxPurchasePrice - s.inputs.purchasePrice),
          better: "high",
        },
        { label: t.calc.requiredRent, cell: (s) => eur(s.results.requiredMonthlyRent) },
        { label: t.calc.monthlyCashflow, cell: (s) => eur(s.results.monthlyCashflow), score: (s) => s.results.monthlyCashflow, better: "high" },
        { label: t.calc.goalMargin, cell: (s) => eur(s.results.goalMargin), score: (s) => s.results.goalMargin, better: "high" },
        { label: t.calc.loanAmount, cell: (s) => eur(s.results.loanAmount) },
        { label: t.calc.ltv, cell: (s) => pct(s.results.ltvPct), score: (s) => s.results.ltvPct, better: "low" },
        { label: t.calc.annuity, cell: (s) => eur(s.results.monthlyAnnuity) },
        { label: t.calc.grossYield, cell: (s) => pct(s.results.grossYieldPct), score: (s) => s.results.grossYieldPct, better: "high" },
        { label: t.calc.netYield, cell: (s) => pct(s.results.netYieldPct), score: (s) => s.results.netYieldPct, better: "high" },
        { label: t.calc.priceFactor, cell: (s) => formatNum(s.results.priceFactor, lang, 1), score: (s) => s.results.priceFactor, better: "low" },
        {
          label: t.calc.residualDebt,
          cell: (s) => eur(s.results.residualDebtAtFixedRateEnd),
          score: (s) => s.results.residualDebtAtFixedRateEnd,
          better: "low",
        },
      ],
    ],
  ];

  const bestId = (row: Row) => {
    if (!row.score) return null;
    let best: { id: string; v: number } | null = null;
    for (const s of scenarios) {
      const v = row.score(s);
      if (v === null) continue;
      if (!best || (row.better === "low" ? v < best.v : v > best.v)) best = { id: s.id, v };
    }
    return best?.id ?? null;
  };

  return (
    <div className="space-y-6">
      <Link href="/scenarios" className="btn-ghost btn-sm -ml-2">
        <ArrowLeft className="size-4" aria-hidden />
        {t.scenarios.title}
      </Link>
      <PageHeader title={t.scenarios.compareTitle} />
      {scenarios.length < 2 ? (
        <p className="card card-pad text-sm text-ink-2">{t.scenarios.compareHint}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th className="w-56" />
                {scenarios.map((s) => (
                  <th key={s.id} className="normal-case! tracking-normal! align-top">
                    <div className="grid justify-items-start gap-2 py-1">
                      <Link
                        href={`/calculator?scenario=${s.id}`}
                        className="font-display text-[15px] font-bold text-ink hover:text-accent"
                      >
                        {s.name}
                      </Link>
                      <StatusPill status={s.status} label={t.status[s.status]} size="sm" />
                      <div className="w-full">
                      <MiniGauge
                        price={s.inputs.purchasePrice}
                        max={s.results.maxPurchasePrice}
                        status={s.status}
                        label={`${t.viz.gaugePrice} ${eur(s.inputs.purchasePrice)} · ${t.viz.gaugeMax} ${eur(s.results.maxPurchasePrice)}`}
                      />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map(([group, rows]) => (
              <tbody key={group}>
                <tr>
                  <td colSpan={scenarios.length + 1} className="bg-surface-2 py-2! font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                    {group}
                  </td>
                </tr>
                {rows.map((row) => {
                  const best = bestId(row);
                  return (
                    <tr key={row.label}>
                      <th scope="row" className="border-b border-line font-sans! text-[13px]! font-normal! tracking-normal! whitespace-normal! text-ink-2! normal-case!">
                        {row.label}
                      </th>
                      {scenarios.map((s) => (
                        <td key={s.id} className={`num ${best === s.id ? "bg-accent-soft font-semibold" : ""}`}>
                          {row.cell(s)}
                          {best === s.id && <span className="sr-only"> ({t.scenarios.best})</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-muted">
            <i className="inline-block h-3 w-5 rounded-sm bg-accent-soft" aria-hidden />
            {t.scenarios.bestHint}
          </p>
        </div>
      )}
    </div>
  );
}
