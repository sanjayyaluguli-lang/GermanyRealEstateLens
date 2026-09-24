import Link from "next/link";
import { StatusDot } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland } from "@/lib/calc/regions";
import type { Scenario } from "@/lib/data/scenarios";
import { getScenarios } from "@/lib/data/scenarios";
import { formatEur, formatNum } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ComparePage({ searchParams }: PageProps<"/scenarios/compare">) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : [];
  const ids = [...new Set(raw.filter((id) => UUID.test(id)))].slice(0, 4);
  const [{ t, lang }, scenarios] = await Promise.all([getT(), getScenarios(user.id, ids)]);
  const eur = (n: number | null) => formatEur(n, lang);
  const pct = (n: number | null) => (n === null ? "—" : `${formatNum(n, lang, 2)} %`);

  const rows: [string, (s: Scenario) => React.ReactNode][] = [
    [t.scenarios.status, (s) => <StatusDot status={s.status} label={t.status[s.status]} />],
    [t.calc.goal, (s) => t.goals[s.inputs.goal]],
    [t.calc.bundesland, (s) => getBundesland(s.inputs.bundesland)?.name],
    [t.calc.purchasePrice, (s) => eur(s.inputs.purchasePrice)],
    [t.calc.livingArea, (s) => formatNum(s.inputs.livingArea, lang, 0)],
    [t.calc.monthlyColdRent, (s) => eur(s.inputs.monthlyColdRent)],
    [t.calc.equity, (s) => eur(s.inputs.equity)],
    [t.calc.interestRatePct, (s) => pct(s.inputs.interestRatePct)],
    [t.calc.repaymentRatePct, (s) => pct(s.inputs.repaymentRatePct)],
    [t.calc.maxPurchasePrice, (s) => eur(s.results.maxPurchasePrice)],
    [t.calc.requiredRent, (s) => eur(s.results.requiredMonthlyRent)],
    [t.calc.monthlyCashflow, (s) => eur(s.results.monthlyCashflow)],
    [t.calc.goalMargin, (s) => eur(s.results.goalMargin)],
    [t.calc.loanAmount, (s) => eur(s.results.loanAmount)],
    [t.calc.ltv, (s) => pct(s.results.ltvPct)],
    [t.calc.annuity, (s) => eur(s.results.monthlyAnnuity)],
    [t.calc.grossYield, (s) => pct(s.results.grossYieldPct)],
    [t.calc.netYield, (s) => pct(s.results.netYieldPct)],
    [t.calc.priceFactor, (s) => formatNum(s.results.priceFactor, lang, 1)],
    [t.calc.residualDebt, (s) => eur(s.results.residualDebtAtFixedRateEnd)],
  ];

  return (
    <div className="space-y-5">
      <Link href="/scenarios" className="link text-sm">
        ← {t.scenarios.title}
      </Link>
      <h1 className="h1">{t.scenarios.compareTitle}</h1>
      {scenarios.length < 2 ? (
        <p className="card text-sm text-slate-600">{t.scenarios.compareHint}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2" />
                {scenarios.map((s) => (
                  <th key={s.id} className="px-3 py-2">
                    <Link href={`/calculator?scenario=${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label} className="border-t border-slate-100">
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-600">{label}</th>
                  {scenarios.map((s) => (
                    <td key={s.id} className="px-3 py-1.5 tabular-nums">
                      {cell(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
