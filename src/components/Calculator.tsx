"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  calcInputSchema,
  calculate,
  GOALS,
  RISK_LEVELS,
  type CalcInputs,
  type CalcResults,
} from "@/lib/calc/engine";
import { BUNDESLAENDER, TRANSFER_TAX_VERIFIED, transferTaxFor } from "@/lib/calc/regions";
import { buildSearchUrl } from "@/lib/is24";
import { fill, formatEur, formatNum, getDictionary, type Lang } from "@/lib/i18n";
import { saveScenario, type SaveScenarioState } from "@/app/actions/data";
import { FormMessage, StatusDot, SubmitButton } from "./ui";

type NumericKey = {
  [K in keyof CalcInputs]: CalcInputs[K] extends number ? K : never;
}[keyof CalcInputs];

type Values = Record<NumericKey, string> & Pick<CalcInputs, "bundesland" | "goal" | "riskTolerance">;

function toValues(i: CalcInputs): Values {
  const out = { ...i } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(i)) if (typeof v === "number") out[k] = String(v);
  return out as Values;
}

export type SaveMode = "anonymous" | "needsConsent" | "enabled";

export function Calculator({
  lang,
  initial,
  saveMode,
  loaded,
  prefilledFromProfile,
}: {
  lang: Lang;
  initial: CalcInputs;
  saveMode: SaveMode;
  loaded: { id: string; name: string } | null;
  prefilledFromProfile: boolean;
}) {
  const t = getDictionary(lang);
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [showProjection, setShowProjection] = useState(false);

  const parsed = useMemo(() => calcInputSchema.safeParse(values), [values]);
  const results: CalcResults | null = useMemo(
    () => (parsed.success ? calculate(parsed.data) : null),
    [parsed],
  );

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setValues((v) => {
      const next = { ...v, [key]: value } as Values;
      if (key === "bundesland") next.transferTaxPct = String(transferTaxFor(value));
      return next;
    });
  };

  const eur = (n: number | null | undefined, d = 0) => formatEur(n, lang, d);
  const invalidKeys = new Set(parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0])));

  const num = (key: NumericKey, step = "any") => (
    <div>
      <label className="label" htmlFor={key}>
        {t.calc[key]}
      </label>
      <input
        id={key}
        className={`input ${invalidKeys.has(key) ? "border-red-500" : ""}`}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={values[key]}
        onChange={set(key)}
        aria-invalid={invalidKeys.has(key)}
      />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-5">
        <div>
          <h1 className="h1">{t.calc.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.calc.intro}</p>
          {loaded && (
            <p className="mt-2 text-sm">
              {t.calc.loadedScenario} <strong>{loaded.name}</strong>
            </p>
          )}
          {!loaded && prefilledFromProfile && (
            <p className="mt-2 text-sm text-emerald-800">{t.calc.prefilledFromProfile}</p>
          )}
        </div>

        <section className="card grid gap-4 sm:grid-cols-2">
          <h2 className="h2 sm:col-span-2">{t.calc.sectionProperty}</h2>
          <div>
            <label className="label" htmlFor="bundesland">
              {t.calc.bundesland}
            </label>
            <select id="bundesland" className="input" value={values.bundesland} onChange={set("bundesland")}>
              {BUNDESLAENDER.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {num("purchasePrice", "1000")}
          {num("livingArea", "1")}
          {num("monthlyColdRent", "10")}
        </section>

        <section className="card grid gap-4 sm:grid-cols-2">
          <h2 className="h2 sm:col-span-2">{t.calc.sectionFinancing}</h2>
          {num("equity", "1000")}
          {num("netIncome", "50")}
          {num("interestRatePct", "0.05")}
          {num("repaymentRatePct", "0.1")}
          {num("fixedRateYears", "1")}
        </section>

        <section className="card grid gap-4 sm:grid-cols-3">
          <h2 className="h2 sm:col-span-3">{t.calc.sectionCosts}</h2>
          {num("transferTaxPct", "0.1")}
          {num("notaryPct", "0.1")}
          {num("brokerPct", "0.01")}
        </section>

        <section className="card grid gap-4 sm:grid-cols-3">
          <h2 className="h2 sm:col-span-3">{t.calc.sectionOperating}</h2>
          {num("nonAllocableCostsMonthly", "5")}
          {num("maintenancePerSqmYear", "1")}
          {num("vacancyBufferPct", "0.5")}
        </section>

        <section className="card grid gap-4 sm:grid-cols-3">
          <h2 className="h2 sm:col-span-3">{t.calc.sectionAssumptions}</h2>
          {num("rentGrowthPct", "0.1")}
          {num("costGrowthPct", "0.1")}
          {num("valueGrowthPct", "0.1")}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="goal">
              {t.calc.goal}
            </label>
            <select id="goal" className="input" value={values.goal} onChange={set("goal")}>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {t.goals[g]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="riskTolerance">
              {t.calc.riskTolerance}
            </label>
            <select id="riskTolerance" className="input" value={values.riskTolerance} onChange={set("riskTolerance")}>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {t.risk[r]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <button type="button" className="btn-secondary" onClick={() => setValues(toValues(initial))}>
          {t.calc.reset}
        </button>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        {results && parsed.success ? (
          <>
            <ResultsPanel lang={lang} r={results} inputs={parsed.data} />
            <SavePanel lang={lang} saveMode={saveMode} loaded={loaded} inputs={parsed.data} />
          </>
        ) : (
          <div className="card text-sm text-red-700">{t.common.invalidInput}</div>
        )}
        <p className="text-xs text-slate-500">{fill(t.calc.disclaimer, { date: TRANSFER_TAX_VERIFIED })}</p>
      </aside>

      {results && (
        <section className="card lg:col-span-2">
          <button type="button" className="link text-sm" onClick={() => setShowProjection((s) => !s)}>
            {showProjection ? "▾" : "▸"} {t.calc.showProjection}
          </button>
          {showProjection && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-right text-xs tabular-nums">
                <thead className="text-slate-500">
                  <tr>
                    {[
                      t.calc.pYear,
                      t.calc.pRent,
                      t.calc.pCosts,
                      t.calc.pInterest,
                      t.calc.pPrincipal,
                      t.calc.pCashflow,
                      t.calc.pCumulative,
                      t.calc.pDebt,
                      t.calc.pValue,
                      t.calc.pEquity,
                    ].map((h) => (
                      <th key={h} className="px-2 py-1 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.projection.map((y) => (
                    <tr
                      key={y.year}
                      className={`border-t border-slate-100 ${
                        parsed.success && y.year === parsed.data.fixedRateYears ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-2 py-1">{y.year}</td>
                      <td className="px-2 py-1">{eur(y.rent)}</td>
                      <td className="px-2 py-1">{eur(y.costs)}</td>
                      <td className="px-2 py-1">{eur(y.interest)}</td>
                      <td className="px-2 py-1">{eur(y.principal)}</td>
                      <td className={`px-2 py-1 ${y.cashflow < 0 ? "text-red-700" : ""}`}>{eur(y.cashflow)}</td>
                      <td className={`px-2 py-1 ${y.cumulativeCashflow < 0 ? "text-red-700" : ""}`}>
                        {eur(y.cumulativeCashflow)}
                      </td>
                      <td className="px-2 py-1">{eur(y.remainingDebt)}</td>
                      <td className="px-2 py-1">{eur(y.propertyValue)}</td>
                      <td className="px-2 py-1">{eur(y.equityInProperty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function ResultsPanel({ lang, r, inputs }: { lang: Lang; r: CalcResults; inputs: CalcInputs }) {
  const t = getDictionary(lang);
  const eur = (n: number | null | undefined, d = 0) => formatEur(n, lang, d);
  const pct = (n: number | null) => (n === null ? "—" : `${formatNum(n, lang, 2)} %`);
  const maxPrice = r.maxPurchasePriceUnbounded
    ? t.common.unlimited
    : r.maxPurchasePrice === null
      ? t.common.notAchievable
      : eur(r.maxPurchasePrice);
  const is24 =
    r.maxPurchasePrice && r.maxPurchasePrice > 0
      ? buildSearchUrl({ bundesland: inputs.bundesland, maxPrice: r.maxPurchasePrice })
      : null;

  const row = (label: string, value: string, strong = false) => (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="h2">{t.calc.results}</h2>
        <StatusDot status={r.status} label={t.status[r.status]} />
      </div>
      <p className="text-xs text-slate-500">{t.goals[inputs.goal]}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">{t.calc.maxPurchasePrice}</div>
          <div className="text-lg font-semibold tabular-nums">{maxPrice}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">{t.calc.requiredRent}</div>
          <div className="text-lg font-semibold tabular-nums">{eur(r.requiredMonthlyRent)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">{t.calc.monthlyCashflow}</div>
          <div className={`text-lg font-semibold tabular-nums ${r.monthlyCashflow < 0 ? "text-red-700" : "text-emerald-800"}`}>
            {eur(r.monthlyCashflow)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">{t.calc.ltv}</div>
          <div className="text-lg font-semibold tabular-nums">{pct(r.ltvPct)}</div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {row(t.calc.goalMargin, `${eur(r.goalMargin)} ${t.common.perMonth}`, true)}
        {r.allowedMonthlyShortfall > 0 && row(t.calc.allowedShortfall, `${eur(r.allowedMonthlyShortfall)} ${t.common.perMonth}`)}
        {row(t.calc.cashflowBeforeRepayment, eur(r.monthlyCashflowBeforeRepayment))}
        {row(t.calc.effectiveRent, eur(r.effectiveMonthlyRent))}
        {row(t.calc.operatingCosts, eur(r.monthlyOperatingCosts))}
        {row(t.calc.annuity, eur(r.monthlyAnnuity))}
        {row(`  ${t.calc.interest} / ${t.calc.repayment}`, `${eur(r.monthlyInterest)} / ${eur(r.monthlyRepayment)}`)}
        {row(t.calc.acquisitionCosts, eur(r.acquisitionCosts))}
        {row(t.calc.totalInvestment, eur(r.totalInvestment))}
        {row(t.calc.loanAmount, eur(r.loanAmount))}
        {row(t.calc.grossYield, pct(r.grossYieldPct))}
        {row(t.calc.netYield, pct(r.netYieldPct))}
        {row(t.calc.priceFactor, formatNum(r.priceFactor, lang, 1))}
        {row(t.calc.debtServiceShare, pct(r.debtServiceSharePct))}
        {row(`${t.calc.residualDebt} (${inputs.fixedRateYears})`, eur(r.residualDebtAtFixedRateEnd))}
        {row(t.calc.payoff, r.payoffYears === null ? "> 30" : `${r.payoffYears} ${t.calc.years}`)}
      </div>

      {r.warnings.length > 0 && (
        <ul className="space-y-1 rounded-md bg-amber-50 p-3 text-xs text-amber-900">
          {r.warnings.map((w) => (
            <li key={w}>⚠ {t.warnings[w]}</li>
          ))}
        </ul>
      )}

      {is24 && (
        <a href={is24} target="_blank" rel="noopener noreferrer" className="link block text-sm">
          ↗ {t.calc.searchIs24}
        </a>
      )}
    </div>
  );
}

function SavePanel({
  lang,
  saveMode,
  loaded,
  inputs,
}: {
  lang: Lang;
  saveMode: SaveMode;
  loaded: { id: string; name: string } | null;
  inputs: CalcInputs;
}) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<SaveScenarioState, FormData>(saveScenario, undefined);
  const savedId = state?.id ?? loaded?.id;

  if (saveMode === "anonymous")
    return (
      <div className="card text-sm">
        <p>{t.calc.loginToSave}</p>
        <div className="mt-3 flex gap-2">
          <Link href="/login?next=/calculator" className="btn-secondary">
            {t.nav.login}
          </Link>
          <Link href="/register" className="btn">
            {t.nav.register}
          </Link>
        </div>
      </div>
    );
  if (saveMode === "needsConsent")
    return (
      <div className="card text-sm">
        <p>{t.calc.consentToSave}</p>
        <Link href="/profile" className="link mt-2 inline-block">
          {t.nav.profile} →
        </Link>
      </div>
    );

  return (
    <form action={action} className="card space-y-3">
      <h2 className="h2">{t.calc.saveTitle}</h2>
      <input type="hidden" name="inputs" value={JSON.stringify(inputs)} />
      {savedId && <input type="hidden" name="scenarioId" value={savedId} />}
      <div>
        <label className="label" htmlFor="scenario-name">
          {t.calc.scenarioName}
        </label>
        <input
          id="scenario-name"
          name="name"
          className="input"
          required
          maxLength={120}
          defaultValue={loaded?.name ?? ""}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="mode" value="new">
          {t.calc.saveNew}
        </SubmitButton>
        {savedId && (
          <SubmitButton name="mode" value="overwrite" className="btn-secondary">
            {t.calc.overwrite}
          </SubmitButton>
        )}
      </div>
      <FormMessage state={state} />
    </form>
  );
}
