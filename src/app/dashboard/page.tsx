import Link from "next/link";
import { ArrowUpRight, MapPin, Pencil, Plus } from "lucide-react";
import { MiniGauge } from "@/components/MiniGauge";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import type { Status } from "@/lib/calc/engine";
import { getBundesland, getCity } from "@/lib/calc/regions";
import { getProfile } from "@/lib/data/profile";
import { listScenarios } from "@/lib/data/scenarios";
import { buildSearchUrl } from "@/lib/is24";
import { formatEur, formatNum, locale } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

const stripUnit = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

export default async function DashboardPage() {
  const user = await requireUser();
  const [{ t, lang }, profile, scenarios] = await Promise.all([getT(), getProfile(user.id), listScenarios(user.id)]);
  const eur = (n: number | null) => formatEur(n, lang);
  const recent = scenarios.slice(0, 8);
  const latestFeasible = scenarios.find((s) => s.status !== "red" && s.results.maxPurchasePrice);
  const maxPrice = latestFeasible?.results.maxPurchasePrice ?? null;
  const counts: Record<Status, number> = { green: 0, yellow: 0, red: 0 };
  for (const s of scenarios) counts[s.status]++;

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

  const strategy: [string, string][] = [
    [t.calc.goal, t.goals[profile.defaultGoal]],
    [t.calc.riskTolerance, t.risk[profile.riskTolerance]],
    [t.calc.interestRatePct, `${formatNum(profile.interestRatePct, lang, 2)} %`],
    [t.calc.repaymentRatePct, `${formatNum(profile.repaymentRatePct, lang, 2)} %`],
    [t.calc.fixedRateYears, `${formatNum(profile.fixedRateYears, lang, 0)} ${t.calc.years}`],
    [t.calc.vacancyBufferPct, `${formatNum(profile.vacancyBufferPct, lang, 1)} %`],
  ];

  const figures: [string, string][] = [
    [stripUnit(t.calc.equity), profile.financials ? eur(profile.financials.equity) : "—"],
    [stripUnit(t.calc.netIncome), profile.financials ? eur(profile.financials.netIncome) : "—"],
    [t.dashboardExtra.budget, maxPrice ? eur(maxPrice) : t.dashboardExtra.noBudget],
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t.dashboard.title}
        title={t.dashboard.welcome}
        lede={user.email}
        actions={
          <Link href="/calculator" className="btn">
            <Plus className="size-4" aria-hidden />
            {t.dashboard.newCalc}
          </Link>
        }
      />

      <dl className="card grid gap-px overflow-hidden bg-line sm:grid-cols-2 xl:grid-cols-4">
        {figures.map(([label, value]) => (
          <div key={label} className="bg-surface p-5">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</dd>
          </div>
        ))}
        <div className="bg-surface p-5">
          <dt className="text-xs text-muted">{t.dashboardExtra.counts}</dt>
          <dd className="mt-2.5 flex flex-wrap gap-1.5">
            {(["green", "yellow", "red"] as const).map((s) => (
              <StatusPill key={s} status={s} size="sm" label={`${counts[s]} ${t.status[s]}`} />
            ))}
          </dd>
        </div>
      </dl>

      {!profile.financials && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          {t.dashboard.noFinancial}
          <Link href="/profile" className="font-semibold underline underline-offset-4">
            {t.dashboard.editProfile}
          </Link>
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="h2">{t.dashboard.scenarios}</h2>
            <Link href="/scenarios" className="link text-sm">
              {t.dashboard.allScenarios} →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="grid justify-items-start gap-3 px-5 py-8">
              <p className="text-sm text-ink-2">{t.dashboard.noScenarios}</p>
              <Link href="/calculator" className="btn-secondary">
                <Plus className="size-4" aria-hidden />
                {t.dashboard.newCalc}
              </Link>
            </div>
          ) : (
            <ul>
              {recent.map((s) => (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/calculator?scenario=${s.id}`}
                    className="grid gap-x-6 gap-y-2.5 px-5 py-4 transition-colors hover:bg-surface-2 sm:grid-cols-[minmax(0,1fr)_9rem_8.5rem] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {getBundesland(s.inputs.bundesland)?.name} · {eur(s.inputs.purchasePrice)} ·{" "}
                        {s.updatedAt.toLocaleDateString(locale(lang))}
                      </p>
                    </div>
                    <div className="grid gap-1">
                      <MiniGauge
                        price={s.inputs.purchasePrice}
                        max={s.results.maxPurchasePrice}
                        status={s.status}
                        label={`${t.viz.gaugePrice} ${eur(s.inputs.purchasePrice)} · ${t.viz.gaugeMax} ${eur(s.results.maxPurchasePrice)}`}
                      />
                      <p className="text-[11px] text-muted">
                        {t.viz.mResult}{" "}
                        <span className={`num font-medium ${s.results.monthlyCashflow < 0 ? "text-bad" : "text-good"}`}>
                          {eur(s.results.monthlyCashflow)}
                        </span>
                      </p>
                    </div>
                    <span className="sm:justify-self-end">
                      <StatusPill status={s.status} label={t.status[s.status]} size="sm" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6">
          <section className="card card-pad space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="h2 text-base">{t.profile.strategy}</h2>
              <Link href="/profile" className="btn-ghost btn-sm">
                <Pencil className="size-3.5" aria-hidden />
                {t.dashboard.editProfile}
              </Link>
            </div>
            <dl className="text-[13px]">
              {strategy.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line py-2 last:border-b-0">
                  <dt className="text-ink-2">{stripUnit(k)}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card card-pad space-y-3">
            <h2 className="h2 flex items-center gap-2 text-base">
              <MapPin className="size-4 text-accent" aria-hidden />
              {t.dashboard.searchRegions}
            </h2>
            <p className="text-xs text-muted">
              {t.dashboard.searchHint}
              {maxPrice ? ` (${eur(maxPrice)})` : ""}
            </p>
            {regionLinks.length === 0 ? (
              <p className="text-sm text-ink-2">{t.dashboard.noRegions}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regionLinks.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] font-medium transition-colors hover:border-accent hover:text-accent"
                  >
                    {l.label}
                    <ArrowUpRight className="size-3.5" aria-hidden />
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
