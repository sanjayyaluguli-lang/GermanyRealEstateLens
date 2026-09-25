import Link from "next/link";
import { ArrowUpRight, GitCompare, Pencil, Plus, Trash2 } from "lucide-react";
import { removeScenario } from "@/app/actions/data";
import { MiniGauge } from "@/components/MiniGauge";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill, SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland } from "@/lib/calc/regions";
import { listScenarios } from "@/lib/data/scenarios";
import { buildSearchUrl } from "@/lib/is24";
import { formatEur, locale } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export default async function ScenariosPage() {
  const user = await requireUser();
  const [{ t, lang }, scenarios] = await Promise.all([getT(), listScenarios(user.id)]);
  const eur = (n: number | null) => formatEur(n, lang);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${scenarios.length} ${t.scenarios.title}`}
        title={t.scenarios.title}
        actions={
          <Link href="/calculator" className="btn">
            <Plus className="size-4" aria-hidden />
            {t.dashboard.newCalc}
          </Link>
        }
      />

      {scenarios.length === 0 ? (
        <div className="card card-pad grid justify-items-start gap-3">
          <p className="text-sm text-ink-2">{t.dashboard.noScenarios}</p>
          <Link href="/calculator" className="btn-secondary">
            <Plus className="size-4" aria-hidden />
            {t.dashboard.newCalc}
          </Link>
        </div>
      ) : (
        <>
          <form
            id="compare"
            action="/scenarios/compare"
            method="get"
            className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-3 text-sm"
          >
            <button className="btn-secondary btn-sm">
              <GitCompare className="size-4" aria-hidden />
              {t.scenarios.compareSelected}
            </button>
            <span className="text-muted">{t.scenarios.compareHint}</span>
          </form>

          <div className="card overflow-x-auto">
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th className="w-10" />
                  <th>{t.scenarios.name}</th>
                  <th>{t.scenarios.status}</th>
                  <th className="text-right!">{t.viz.gaugePrice}</th>
                  <th className="w-40">
                    {t.viz.gaugePrice} / {t.viz.gaugeMax}
                  </th>
                  <th className="text-right!">{t.viz.mResult}</th>
                  <th>{t.scenarios.updated}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="checkbox"
                        name="ids"
                        value={s.id}
                        form="compare"
                        aria-label={s.name}
                        className="size-4 accent-[var(--accent)]"
                      />
                    </td>
                    <td className="max-w-64">
                      <Link href={`/calculator?scenario=${s.id}`} className="block truncate font-semibold hover:text-accent">
                        {s.name}
                      </Link>
                      <span className="text-xs text-muted">{getBundesland(s.inputs.bundesland)?.name}</span>
                    </td>
                    <td>
                      <StatusPill status={s.status} label={t.status[s.status]} size="sm" />
                    </td>
                    <td className="num text-right">{eur(s.inputs.purchasePrice)}</td>
                    <td>
                      <div className="grid gap-1">
                        <MiniGauge
                          price={s.inputs.purchasePrice}
                          max={s.results.maxPurchasePrice}
                          status={s.status}
                          label={`${t.viz.gaugeMax} ${eur(s.results.maxPurchasePrice)}`}
                        />
                        {s.results.maxPurchasePrice ? (
                          <a
                            className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-accent"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={buildSearchUrl({ bundesland: s.inputs.bundesland, maxPrice: s.results.maxPurchasePrice })}
                            title={t.calc.searchIs24}
                          >
                            {t.viz.gaugeMax} <span className="num">{eur(s.results.maxPurchasePrice)}</span>
                            <ArrowUpRight className="size-3" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted">{t.common.notAchievable}</span>
                        )}
                      </div>
                    </td>
                    <td className={`num text-right ${s.results.monthlyCashflow < 0 ? "text-bad" : "text-good"}`}>
                      {eur(s.results.monthlyCashflow)}
                    </td>
                    <td className="text-xs whitespace-nowrap text-muted">{s.updatedAt.toLocaleDateString(locale(lang))}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link href={`/calculator?scenario=${s.id}`} className="btn-ghost btn-sm" title={t.scenarios.load}>
                          <Pencil className="size-3.5" aria-hidden />
                          {t.scenarios.load}
                        </Link>
                        <form action={removeScenario}>
                          <input type="hidden" name="id" value={s.id} />
                          <SubmitButton className="btn-ghost btn-sm text-bad hover:text-bad">
                            <Trash2 className="size-3.5" aria-hidden />
                            {t.common.delete}
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
