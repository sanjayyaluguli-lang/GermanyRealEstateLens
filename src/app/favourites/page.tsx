import Link from "next/link";
import { removeFavourite } from "@/app/actions/data";
import { AddFavouriteForm } from "@/components/AccountForms";
import { StatusDot, SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getBundesland } from "@/lib/calc/regions";
import { listFavourites } from "@/lib/data/favourites";
import { getProfile, inputsFromProfile } from "@/lib/data/profile";
import { exposeUrl } from "@/lib/is24";
import { formatEur, formatNum } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export default async function FavouritesPage() {
  const user = await requireUser();
  const [{ t, lang }, favourites, profile] = await Promise.all([
    getT(),
    listFavourites(user.id),
    getProfile(user.id),
  ]);
  const eur = (n: number | null) => formatEur(n, lang);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{t.favourites.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.favourites.intro}</p>
      </div>
      {profile.financialConsentAt ? (
        <AddFavouriteForm lang={lang} defaultState={inputsFromProfile(profile).bundesland} />
      ) : (
        <p className="card text-sm">
          {t.calc.consentToSave}{" "}
          <Link href="/profile" className="link">
            {t.nav.profile} →
          </Link>
        </p>
      )}
      {favourites.length === 0 ? (
        <p className="text-sm text-slate-600">{t.favourites.empty}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {favourites.map((f) => {
            const q = new URLSearchParams({
              bundesland: f.inputs.bundesland,
              purchasePrice: String(f.inputs.purchasePrice),
              monthlyColdRent: String(f.inputs.monthlyColdRent),
              livingArea: String(f.inputs.livingArea),
            });
            return (
              <li key={f.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{f.title}</h2>
                    <p className="text-xs text-slate-500">
                      {getBundesland(f.inputs.bundesland)?.name} · Exposé {f.exposeId}
                    </p>
                  </div>
                  <StatusDot status={f.status} label={t.status[f.status]} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-slate-600">{t.calc.purchasePrice}</dt>
                  <dd className="text-right tabular-nums">{eur(f.inputs.purchasePrice)}</dd>
                  <dt className="text-slate-600">{t.calc.monthlyColdRent}</dt>
                  <dd className="text-right tabular-nums">{eur(f.inputs.monthlyColdRent)}</dd>
                  <dt className="text-slate-600">{t.calc.monthlyCashflow}</dt>
                  <dd className="text-right tabular-nums">{eur(f.results.monthlyCashflow)}</dd>
                  <dt className="text-slate-600">{t.calc.grossYield}</dt>
                  <dd className="text-right tabular-nums">{formatNum(f.results.grossYieldPct, lang, 2)} %</dd>
                  <dt className="text-slate-600">{t.calc.priceFactor}</dt>
                  <dd className="text-right tabular-nums">{formatNum(f.results.priceFactor, lang, 1)}</dd>
                </dl>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                  <a href={exposeUrl(f.exposeId)} target="_blank" rel="noopener noreferrer" className="link">
                    ↗ {t.favourites.openExpose}
                  </a>
                  <Link href={`/calculator?${q}`} className="link">
                    {t.favourites.analyse}
                  </Link>
                  <form action={removeFavourite} className="ml-auto">
                    <input type="hidden" name="id" value={f.id} />
                    <SubmitButton className="btn-secondary px-2 py-1 text-xs text-red-700">{t.common.delete}</SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
