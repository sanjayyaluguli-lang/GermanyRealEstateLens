"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Landmark,
  Receipt,
  RotateCcw,
  Save,
  Target,
  TriangleAlert,
  Wrench,
} from "lucide-react";
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
import { MonthlyBreakdown, PriceGauge, ProjectionChart } from "./charts";
import { FormMessage, StatusPill, SubmitButton } from "./ui";

type NumericKey = {
  [K in keyof CalcInputs]: CalcInputs[K] extends number ? K : never;
}[keyof CalcInputs];

type Values = Record<NumericKey, string> & Pick<CalcInputs, "bundesland" | "goal" | "riskTolerance">;

function toValues(i: CalcInputs): Values {
  const out = { ...i } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(i)) if (typeof v === "number") out[k] = String(v);
  return out as Values;
}

/** Units are shown inside the field, so drop the "(€)" part of the label. */
const stripUnit = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

const UNITS: Record<NumericKey, string> = {
  purchasePrice: "€",
  livingArea: "m²",
  monthlyColdRent: "€/Mon.",
  equity: "€",
  netIncome: "€/Mon.",
  interestRatePct: "% p.a.",
  repaymentRatePct: "% p.a.",
  fixedRateYears: "J.",
  transferTaxPct: "%",
  notaryPct: "%",
  brokerPct: "%",
  nonAllocableCostsMonthly: "€/Mon.",
  maintenancePerSqmYear: "€/m²/J.",
  vacancyBufferPct: "%",
  rentGrowthPct: "% p.a.",
  costGrowthPct: "% p.a.",
  valueGrowthPct: "% p.a.",
};

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
  const [showTable, setShowTable] = useState(false);

  const parsed = useMemo(() => calcInputSchema.safeParse(values), [values]);
  const results: CalcResults | null = useMemo(() => (parsed.success ? calculate(parsed.data) : null), [parsed]);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setValues((v) => {
      const next = { ...v, [key]: value } as Values;
      if (key === "bundesland") next.transferTaxPct = String(transferTaxFor(value));
      return next;
    });
  };

  const invalidKeys = new Set(parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0])));

  const num = (key: NumericKey, step = "any") => (
    <div>
      <label className="label" htmlFor={key}>
        {stripUnit(t.calc[key])}
      </label>
      <div className="field-affix">
        <input
          id={key}
          className="input"
          type="number"
          inputMode="decimal"
          step={step}
          min={0}
          value={values[key]}
          onChange={set(key)}
          aria-invalid={invalidKeys.has(key)}
        />
        <span className="affix">{UNITS[key]}</span>
      </div>
    </div>
  );

  const section = (Icon: typeof Building2, title: string, children: React.ReactNode, cols = "sm:grid-cols-2") => (
    <fieldset className="grid gap-4 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="contents">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="size-4 text-accent" aria-hidden />
          {title}
        </span>
      </legend>
      <div className={`grid gap-4 ${cols}`}>{children}</div>
    </fieldset>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="eyebrow">
            {loaded ? `${t.calc.loadedScenario} ${loaded.name}` : prefilledFromProfile ? t.calc.prefilledFromProfile : t.nav.calculator}
          </p>
          <h1 className="h1">{t.calc.title}</h1>
          <p className="lede">{t.calc.intro}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setValues(toValues(initial))}>
          <RotateCcw className="size-4" aria-hidden />
          {t.calc.reset}
        </button>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <form className="card card-pad grid gap-6" onSubmit={(e) => e.preventDefault()} aria-label={t.viz.inputsTitle}>
          {section(
            Building2,
            t.calc.sectionProperty,
            <>
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
            </>,
          )}
          {section(
            Landmark,
            t.calc.sectionFinancing,
            <>
              {num("equity", "1000")}
              {num("netIncome", "50")}
              {num("interestRatePct", "0.05")}
              {num("repaymentRatePct", "0.1")}
              {num("fixedRateYears", "1")}
            </>,
          )}
          {section(
            Receipt,
            t.calc.sectionCosts,
            <>
              {num("transferTaxPct", "0.1")}
              {num("notaryPct", "0.1")}
              {num("brokerPct", "0.01")}
            </>,
            "sm:grid-cols-3",
          )}
          {section(
            Wrench,
            t.calc.sectionOperating,
            <>
              {num("nonAllocableCostsMonthly", "5")}
              {num("maintenancePerSqmYear", "1")}
              {num("vacancyBufferPct", "0.5")}
            </>,
            "sm:grid-cols-3",
          )}
          {section(
            Target,
            t.calc.sectionAssumptions,
            <>
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
            </>,
            "sm:grid-cols-3",
          )}
        </form>

        <aside className="grid gap-4 xl:sticky xl:top-6">
          {results && parsed.success ? (
            <>
              <Verdict lang={lang} r={results} inputs={parsed.data} />
              <section className="card card-pad">
                <MonthlyBreakdown lang={lang} inputs={parsed.data} r={results} />
              </section>
              <KeyFigures lang={lang} r={results} inputs={parsed.data} />
              <SavePanel lang={lang} saveMode={saveMode} loaded={loaded} inputs={parsed.data} />
            </>
          ) : (
            <div className="card card-pad flex items-start gap-2 text-sm text-bad">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t.common.invalidInput}
            </div>
          )}
        </aside>
      </div>

      {results && parsed.success && (
        <section className="card card-pad space-y-4">
          <ProjectionChart lang={lang} inputs={parsed.data} r={results} />
          <button type="button" className="btn-ghost btn-sm" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>
            <ChevronDown className={`size-4 transition-transform ${showTable ? "rotate-180" : ""}`} aria-hidden />
            {showTable ? t.viz.hideTable : t.viz.showTable}
          </button>
          {showTable && <ProjectionTable lang={lang} r={results} fixedRateYears={parsed.data.fixedRateYears} />}
        </section>
      )}

      <p className="text-xs text-muted">{fill(t.calc.disclaimer, { date: TRANSFER_TAX_VERIFIED })}</p>
    </div>
  );
}

function Verdict({ lang, r, inputs }: { lang: Lang; r: CalcResults; inputs: CalcInputs }) {
  const t = getDictionary(lang);
  const eur = (n: number | null | undefined) => formatEur(n, lang);
  const sentence = r.warnings.includes("no_rent")
    ? t.viz.verdictNoRent
    : r.goalMet
      ? fill(t.viz.verdictAbove, { amount: eur(r.goalMargin) })
      : fill(t.viz.verdictBelow, { amount: eur(-r.goalMargin) });
  const is24 =
    r.maxPurchasePrice && r.maxPurchasePrice > 0
      ? buildSearchUrl({ bundesland: inputs.bundesland, maxPrice: r.maxPurchasePrice })
      : null;

  const tiles: [string, string, string?][] = [
    [
      t.calc.maxPurchasePrice,
      r.maxPurchasePriceUnbounded ? t.common.unlimited : r.maxPurchasePrice === null ? t.common.notAchievable : eur(r.maxPurchasePrice),
    ],
    [t.calc.requiredRent, eur(r.requiredMonthlyRent)],
    [t.calc.monthlyCashflow, eur(r.monthlyCashflow), r.monthlyCashflow < 0 ? "text-bad" : "text-good"],
    [t.calc.ltv, `${formatNum(r.ltvPct, lang, 1)} %`],
  ];

  return (
    <section className="card card-pad space-y-5" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="eyebrow">{t.calc.results}</p>
          <p className="font-display text-xl leading-snug font-bold">{sentence}</p>
          <p className="text-xs text-muted">{t.goals[inputs.goal]}</p>
        </div>
        <StatusPill status={r.status} label={t.status[r.status]} />
      </div>

      <PriceGauge lang={lang} inputs={inputs} r={r} />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {tiles.map(([label, value, cls]) => (
          <div key={label} className="bg-surface p-3">
            <dt className="text-xs leading-snug text-muted">{label}</dt>
            <dd className={`mt-1 text-lg font-semibold ${cls ?? ""}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {r.warnings.length > 0 && (
        <ul className="grid gap-1.5 rounded-lg bg-warn-soft p-3 text-[13px] text-warn">
          {r.warnings.map((w) => (
            <li key={w} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t.warnings[w]}
            </li>
          ))}
        </ul>
      )}

      {is24 && (
        <a href={is24} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
          {t.calc.searchIs24}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      )}
    </section>
  );
}

function KeyFigures({ lang, r, inputs }: { lang: Lang; r: CalcResults; inputs: CalcInputs }) {
  const t = getDictionary(lang);
  const eur = (n: number | null | undefined) => formatEur(n, lang);
  const pct = (n: number | null) => (n === null ? "—" : `${formatNum(n, lang, 2)} %`);
  const rows: [string, string][] = [
    [t.calc.goalMargin, `${eur(r.goalMargin)} ${t.common.perMonth}`],
    ...(r.allowedMonthlyShortfall > 0
      ? [[t.calc.allowedShortfall, `${eur(r.allowedMonthlyShortfall)} ${t.common.perMonth}`] as [string, string]]
      : []),
    [t.calc.cashflowBeforeRepayment, eur(r.monthlyCashflowBeforeRepayment)],
    [t.calc.annuity, eur(r.monthlyAnnuity)],
    [t.calc.acquisitionCosts, eur(r.acquisitionCosts)],
    [t.calc.totalInvestment, eur(r.totalInvestment)],
    [t.calc.loanAmount, eur(r.loanAmount)],
    [t.calc.grossYield, pct(r.grossYieldPct)],
    [t.calc.netYield, pct(r.netYieldPct)],
    [t.calc.priceFactor, formatNum(r.priceFactor, lang, 1)],
    [t.calc.debtServiceShare, pct(r.debtServiceSharePct)],
    [`${t.calc.residualDebt} (${inputs.fixedRateYears} ${t.calc.years})`, eur(r.residualDebtAtFixedRateEnd)],
    [t.calc.payoff, r.payoffYears === null ? `> 30 ${t.calc.years}` : `${r.payoffYears} ${t.calc.years}`],
  ];
  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
        {t.viz.allFigures}
        <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="border-t border-line px-5 py-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line py-2 text-[13px] last:border-b-0">
            <dt className="text-ink-2">{k}</dt>
            <dd className="num text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function ProjectionTable({ lang, r, fixedRateYears }: { lang: Lang; r: CalcResults; fixedRateYears: number }) {
  const t = getDictionary(lang);
  const eur = (n: number) => formatEur(n, lang);
  const heads = [
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
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="table text-right text-xs">
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h} className="text-right!">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="num">
          {r.projection.map((y) => (
            <tr key={y.year} className={y.year === fixedRateYears ? "bg-accent-soft" : ""}>
              <td>{y.year}</td>
              <td>{eur(y.rent)}</td>
              <td>{eur(y.costs)}</td>
              <td>{eur(y.interest)}</td>
              <td>{eur(y.principal)}</td>
              <td className={y.cashflow < 0 ? "text-bad" : ""}>{eur(y.cashflow)}</td>
              <td className={y.cumulativeCashflow < 0 ? "text-bad" : ""}>{eur(y.cumulativeCashflow)}</td>
              <td>{eur(y.remainingDebt)}</td>
              <td>{eur(y.propertyValue)}</td>
              <td>{eur(y.equityInProperty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="card card-pad space-y-3 text-sm">
        <p className="text-ink-2">{t.calc.loginToSave}</p>
        <div className="flex gap-2">
          <Link href="/register" className="btn">
            {t.nav.register}
          </Link>
          <Link href="/login?next=/calculator" className="btn-secondary">
            {t.nav.login}
          </Link>
        </div>
      </div>
    );
  if (saveMode === "needsConsent")
    return (
      <div className="card card-pad space-y-2 text-sm">
        <p className="text-ink-2">{t.calc.consentToSave}</p>
        <Link href="/profile" className="link">
          {t.nav.profile} →
        </Link>
      </div>
    );

  return (
    <form action={action} className="card card-pad space-y-3">
      <h2 className="h2 flex items-center gap-2 text-base">
        <Save className="size-4 text-accent" aria-hidden />
        {t.calc.saveTitle}
      </h2>
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
          placeholder={lang === "en" ? "e.g. Leipzig-Plagwitz 2-room" : "z. B. Leipzig-Plagwitz 2 Zi."}
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
