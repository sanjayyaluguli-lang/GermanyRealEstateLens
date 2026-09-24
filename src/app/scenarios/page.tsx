import Link from "next/link";
import { removeScenario } from "@/app/actions/data";
import { StatusDot, SubmitButton } from "@/components/ui";
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{t.scenarios.title}</h1>
        <Link href="/calculator" className="btn">
          + {t.dashboard.newCalc}
        </Link>
      </div>
      {scenarios.length === 0 ? (
        <p className="card text-sm text-slate-600">{t.dashboard.noScenarios}</p>
      ) : (
        <>
          <form id="compare" action="/scenarios/compare" method="get" className="flex items-center gap-3 text-sm">
            <button className="btn-secondary">{t.scenarios.compareSelected}</button>
            <span className="text-slate-500">{t.scenarios.compareHint}</span>
          </form>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2" />
                  <th className="px-3 py-2">{t.scenarios.name}</th>
                  <th className="px-3 py-2">{t.scenarios.status}</th>
                  <th className="px-3 py-2">{t.scenarios.region}</th>
                  <th className="px-3 py-2 text-right">{t.calc.purchasePrice}</th>
                  <th className="px-3 py-2 text-right">{t.calc.maxPurchasePrice}</th>
                  <th className="px-3 py-2 text-right">{t.calc.monthlyCashflow}</th>
                  <th className="px-3 py-2">{t.scenarios.updated}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 align-middle">
                    <td className="px-3 py-2">
                      <input type="checkbox" name="ids" value={s.id} form="compare" aria-label={s.name} />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/calculator?scenario=${s.id}`} className="hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <StatusDot status={s.status} label={t.status[s.status]} />
                    </td>
                    <td className="px-3 py-2">{getBundesland(s.inputs.bundesland)?.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{eur(s.inputs.purchasePrice)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.results.maxPurchasePrice ? (
                        <a
                          className="link"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={buildSearchUrl({ bundesland: s.inputs.bundesland, maxPrice: s.results.maxPurchasePrice })}
                          title={t.calc.searchIs24}
                        >
                          {eur(s.results.maxPurchasePrice)} ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums ${s.results.monthlyCashflow < 0 ? "text-red-700" : ""}`}>
                      {eur(s.results.monthlyCashflow)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{s.updatedAt.toLocaleString(locale(lang))}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/calculator?scenario=${s.id}`} className="btn-secondary px-2 py-1 text-xs">
                          {t.scenarios.load}
                        </Link>
                        <form action={removeScenario}>
                          <input type="hidden" name="id" value={s.id} />
                          <SubmitButton className="btn-secondary px-2 py-1 text-xs text-red-700">
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
