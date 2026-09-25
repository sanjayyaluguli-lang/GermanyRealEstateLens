import Link from "next/link";
import { ArrowUpRight, Calculator, Lock, Trash2 } from "lucide-react";
import { removeFavourite } from "@/app/actions/data";
import { AddFavouriteForm } from "@/components/AccountForms";
import { MiniGauge } from "@/components/MiniGauge";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill, SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland } from "@/lib/calc/regions";
import { listFavourites } from "@/lib/data/favourites";
import { getProfile, inputsFromProfile } from "@/lib/data/profile";
import { exposeUrl } from "@/lib/is24";
import { formatEur, formatNum } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export default async function FavouritesPage() {
  const user = await requireUser();
  const [{ t, lang }, favourites, profile] = await Promise.all([getT(), listFavourites(user.id), getProfile(user.id)]);
  const eur = (n: number | null) => formatEur(n, lang);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={`${favourites.length} ${t.favourites.title}`} title={t.favourites.title} lede={t.favourites.intro} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="order-2 xl:order-1">
          {favourites.length === 0 ? (
            <p className="card card-pad text-sm text-ink-2">{t.favourites.empty}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {favourites.map((f) => {
                const q = new URLSearchParams({
                  bundesland: f.inputs.bundesland,
                  purchasePrice: String(f.inputs.purchasePrice),
                  monthlyColdRent: String(f.inputs.monthlyColdRent),
                  livingArea: String(f.inputs.livingArea),
                });
                const facts: [string, string][] = [
                  [t.viz.gaugePrice, eur(f.inputs.purchasePrice)],
                  [t.viz.mRent, eur(f.inputs.monthlyColdRent)],
                  [t.viz.mResult, eur(f.results.monthlyCashflow)],
                  [t.calc.grossYield, `${formatNum(f.results.grossYieldPct, lang, 2)} %`],
                  [t.calc.priceFactor, formatNum(f.results.priceFactor, lang, 1)],
                  [t.viz.gaugeMax, eur(f.results.maxPurchasePrice)],
                ];
                return (
                  <li key={f.id} className="card card-pad space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="h2 truncate text-base">{f.title}</h2>
                        <p className="text-xs text-muted">
                          {getBundesland(f.inputs.bundesland)?.name} · {formatNum(f.inputs.livingArea, lang, 0)} m² · Exposé{" "}
                          <span className="num">{f.exposeId}</span>
                        </p>
                      </div>
                      <StatusPill status={f.status} label={t.status[f.status]} size="sm" />
                    </div>
                    <MiniGauge
                      price={f.inputs.purchasePrice}
                      max={f.results.maxPurchasePrice}
                      status={f.status}
                      label={`${t.viz.gaugePrice} ${eur(f.inputs.purchasePrice)} · ${t.viz.gaugeMax} ${eur(f.results.maxPurchasePrice)}`}
                    />
                    <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
                      {facts.map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[11px] text-muted">{k}</dt>
                          <dd
                            className={`num text-[13px] font-medium ${
                              k === t.viz.mResult ? (f.results.monthlyCashflow < 0 ? "text-bad" : "text-good") : ""
                            }`}
                          >
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-wrap items-center gap-1 border-t border-line pt-3">
                      <a href={exposeUrl(f.exposeId)} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                        {t.favourites.openExpose}
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                      <Link href={`/calculator?${q}`} className="btn-ghost btn-sm">
                        <Calculator className="size-3.5" aria-hidden />
                        {t.favourites.analyse}
                      </Link>
                      <form action={removeFavourite} className="ml-auto">
                        <input type="hidden" name="id" value={f.id} />
                        <SubmitButton className="btn-ghost btn-sm text-bad hover:text-bad">
                          <Trash2 className="size-3.5" aria-hidden />
                          {t.common.delete}
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="order-1 xl:sticky xl:top-6 xl:order-2">
          {profile.financialConsentAt ? (
            <AddFavouriteForm lang={lang} defaultState={inputsFromProfile(profile).bundesland} />
          ) : (
            <div className="card card-pad space-y-2 text-sm">
              <p className="flex items-center gap-2 text-ink-2">
                <Lock className="size-4" aria-hidden />
                {t.calc.consentToSave}
              </p>
              <Link href="/profile" className="link">
                {t.nav.profile} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
