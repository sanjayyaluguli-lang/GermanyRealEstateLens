import Link from "next/link";
import { StatusDot } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland, getCity } from "@/lib/calc/regions";
import { getProfile } from "@/lib/data/profile";
import { listScenarios } from "@/lib/data/scenarios";
import { buildSearchUrl } from "@/lib/is24";
import { formatEur, formatNum, locale } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const [{ t, lang }, profile, scenarios] = await Promise.all([
    getT(),
    getProfile(user.id),
    listScenarios(user.id, 8),
  ]);
  const eur = (n: number | null) => formatEur(n, lang);
  const latestFeasible = scenarios.find((s) => s.status !== "red" && s.results.maxPurchasePrice);
  const maxPrice = latestFeasible?.results.maxPurchasePrice ?? null;

  const regionLinks = [
    ...profile.preferredCities.flatMap((id) => {
      const c = getCity(id);
      return c ? [{ label: c.name, url: buildSearchUrl({ bundesland: c.state, cityId: c.id, maxPrice }) }] : [];
    }),
    ...profile.preferredStates.flatMap((code) => {
      const b = getBundesland(code);
      return b ? [{ label: b.name, url: buildSearchUrl({ bundesland: b.code, maxPrice }) }] : [];
    }),
  ];

  const summary: [string, string][] = [
    [t.calc.equity, profile.financials ? eur(profile.financials.equity) : "—"],
    [t.calc.netIncome, profile.financials ? eur(profile.financials.netIncome) : "—"],
    [t.calc.riskTolerance, t.risk[profile.riskTolerance]],
    [t.calc.goal, t.goals[profile.defaultGoal]],
    [t.calc.interestRatePct, formatNum(profile.interestRatePct, lang, 2)],
    [t.calc.repaymentRatePct, formatNum(profile.repaymentRatePct, lang, 2)],
    [t.calc.vacancyBufferPct, formatNum(profile.vacancyBufferPct, lang, 1)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{t.dashboard.title}</h1>
          <p className="text-sm text-slate-600">
            {t.dashboard.welcome}, {user.email}
          </p>
        </div>
        <Link href="/calculator" className="btn">
          + {t.dashboard.newCalc}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card space-y-3 self-start">
          <div className="flex items-center justify-between">
            <h2 className="h2">{t.dashboard.profileSummary}</h2>
            <Link href="/profile" className="link text-sm">
              {t.dashboard.editProfile}
            </Link>
          </div>
          {!profile.financials && <p className="text-sm text-amber-800">{t.dashboard.noFinancial}</p>}
          <dl className="divide-y divide-slate-100 text-sm">
            {summary.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-slate-600">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="h2">{t.dashboard.scenarios}</h2>
              <Link href="/scenarios" className="link text-sm">
                {t.dashboard.allScenarios} →
              </Link>
            </div>
            {scenarios.length === 0 ? (
              <p className="text-sm text-slate-600">{t.dashboard.noScenarios}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {scenarios.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                      <Link href={`/calculator?scenario=${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {getBundesland(s.inputs.bundesland)?.name} · {eur(s.inputs.purchasePrice)} ·{" "}
                        {t.calc.monthlyCashflow}: {eur(s.results.monthlyCashflow)} ·{" "}
                        {s.updatedAt.toLocaleDateString(locale(lang))}
                      </div>
                    </div>
                    <StatusDot status={s.status} label={t.status[s.status]} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="h2">{t.dashboard.searchRegions}</h2>
            <p className="mb-3 text-xs text-slate-500">
              {t.dashboard.searchHint}
              {maxPrice ? ` (${eur(maxPrice)})` : ""}
            </p>
            {regionLinks.length === 0 ? (
              <p className="text-sm text-slate-600">{t.dashboard.noRegions}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regionLinks.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    ↗ {l.label}
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
