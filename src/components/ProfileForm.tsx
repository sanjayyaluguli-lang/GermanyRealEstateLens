"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "@/app/actions/data";
import type { FormState } from "@/app/actions/auth";
import { GOALS, RISK_LEVELS, type Goal, type RiskTolerance } from "@/lib/calc/engine";
import { BUNDESLAENDER, CITIES } from "@/lib/calc/regions";
import { getDictionary, type Lang } from "@/lib/i18n";
import { FormMessage, SubmitButton, submitWithoutReset } from "./ui";

export interface ProfileFormValues {
  consent: boolean;
  equity: number | null;
  netIncome: number | null;
  preferredStates: string[];
  preferredCities: string[];
  riskTolerance: RiskTolerance;
  defaultGoal: Goal;
  interestRatePct: number;
  repaymentRatePct: number;
  fixedRateYears: number;
  vacancyBufferPct: number;
  maintenancePerSqmYear: number;
  brokerPct: number;
  language: Lang;
}

export function ProfileForm({ lang, initial }: { lang: Lang; initial: ProfileFormValues }) {
  const t = getDictionary(lang);
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, undefined);
  const [consent, setConsent] = useState(initial.consent);

  const numField = (name: keyof ProfileFormValues, label: string, value: number | null, step = "any") => (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        defaultValue={value ?? ""}
        className="input"
      />
    </div>
  );

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-5">
      <section className="card space-y-4">
        <h2 className="h2">{t.profile.financial}</h2>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>{t.profile.consent}</span>
        </label>
        {consent ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("equity", t.calc.equity, initial.equity, "1000")}
            {numField("netIncome", t.calc.netIncome, initial.netIncome, "50")}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t.profile.consentMissing}</p>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="h2">{t.profile.regions}</h2>
        <fieldset>
          <legend className="label">{t.profile.states}</legend>
          <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
            {BUNDESLAENDER.map((b) => (
              <label key={b.code} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="preferredStates"
                  value={b.code}
                  defaultChecked={initial.preferredStates.includes(b.code)}
                />
                {b.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">{t.profile.cities}</legend>
          <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
            {CITIES.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="preferredCities"
                  value={c.id}
                  defaultChecked={initial.preferredCities.includes(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card grid gap-4 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">{t.profile.strategy}</h2>
        <div>
          <label className="label" htmlFor="riskTolerance">
            {t.calc.riskTolerance}
          </label>
          <select id="riskTolerance" name="riskTolerance" defaultValue={initial.riskTolerance} className="input">
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {t.risk[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="defaultGoal">
            {t.calc.goal}
          </label>
          <select id="defaultGoal" name="defaultGoal" defaultValue={initial.defaultGoal} className="input">
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {t.goals[g]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card grid gap-4 sm:grid-cols-3">
        <h2 className="h2 sm:col-span-3">{t.profile.defaults}</h2>
        {numField("interestRatePct", t.calc.interestRatePct, initial.interestRatePct, "0.05")}
        {numField("repaymentRatePct", t.calc.repaymentRatePct, initial.repaymentRatePct, "0.1")}
        {numField("fixedRateYears", t.calc.fixedRateYears, initial.fixedRateYears, "1")}
        {numField("vacancyBufferPct", t.calc.vacancyBufferPct, initial.vacancyBufferPct, "0.5")}
        {numField("maintenancePerSqmYear", t.calc.maintenancePerSqmYear, initial.maintenancePerSqmYear, "1")}
        {numField("brokerPct", t.calc.brokerPct, initial.brokerPct, "0.01")}
        <div>
          <label className="label" htmlFor="language">
            {t.profile.language}
          </label>
          <select id="language" name="language" defaultValue={initial.language} className="input">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      <FormMessage state={state} />
      <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
    </form>
  );
}
