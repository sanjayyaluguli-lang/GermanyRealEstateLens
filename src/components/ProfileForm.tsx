"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
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

const stripUnit = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-1">
        <h2 className="h2 text-base">{title}</h2>
        <p className="text-[13px] text-muted">{hint}</p>
      </div>
      <div className="card card-pad">{children}</div>
    </section>
  );
}

/** Pill-style multi-select made of real checkboxes (keyboard and form friendly). */
function ChipCheckbox({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex items-center rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] font-medium text-ink-2 transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent">
        {label}
      </span>
    </label>
  );
}

export function ProfileForm({ lang, initial }: { lang: Lang; initial: ProfileFormValues }) {
  const t = getDictionary(lang);
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, undefined);
  const [consent, setConsent] = useState(initial.consent);

  const numField = (name: keyof ProfileFormValues, label: string, value: number | null, unit: string, step = "any") => (
    <div>
      <label className="label" htmlFor={name}>
        {stripUnit(label)}
      </label>
      <div className="field-affix">
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
        <span className="affix">{unit}</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-8">
      <Section title={t.profile.financial} hint={t.profile.financialHint}>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3 text-[13px] text-ink-2">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
            />
            <span>{t.profile.consent}</span>
          </label>
          {consent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {numField("equity", t.calc.equity, initial.equity, "€", "1000")}
              {numField("netIncome", t.calc.netIncome, initial.netIncome, "€/Mon.", "50")}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Lock className="size-4" aria-hidden />
              {t.profile.consentMissing}
            </p>
          )}
        </div>
      </Section>

      <Section title={t.profile.regions} hint={t.profile.regionsHint}>
        <div className="space-y-5">
          <fieldset className="space-y-2.5">
            <legend className="label">{t.profile.states}</legend>
            <div className="flex flex-wrap gap-2">
              {BUNDESLAENDER.map((b) => (
                <ChipCheckbox
                  key={b.code}
                  name="preferredStates"
                  value={b.code}
                  label={b.name}
                  defaultChecked={initial.preferredStates.includes(b.code)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2.5">
            <legend className="label">{t.profile.cities}</legend>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <ChipCheckbox
                  key={c.id}
                  name="preferredCities"
                  value={c.id}
                  label={c.name}
                  defaultChecked={initial.preferredCities.includes(c.id)}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      <Section title={t.profile.strategy} hint={t.profile.strategyHint}>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </Section>

      <Section title={t.profile.defaults} hint={t.profile.defaultsHint}>
        <div className="grid gap-4 sm:grid-cols-3">
          {numField("interestRatePct", t.calc.interestRatePct, initial.interestRatePct, "% p.a.", "0.05")}
          {numField("repaymentRatePct", t.calc.repaymentRatePct, initial.repaymentRatePct, "% p.a.", "0.1")}
          {numField("fixedRateYears", t.calc.fixedRateYears, initial.fixedRateYears, "J.", "1")}
          {numField("vacancyBufferPct", t.calc.vacancyBufferPct, initial.vacancyBufferPct, "%", "0.5")}
          {numField("maintenancePerSqmYear", t.calc.maintenancePerSqmYear, initial.maintenancePerSqmYear, "€/m²/J.", "1")}
          {numField("brokerPct", t.calc.brokerPct, initial.brokerPct, "%", "0.01")}
          <div>
            <label className="label" htmlFor="language">
              {t.profile.language}
            </label>
            <select id="language" name="language" defaultValue={initial.language} className="input">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 backdrop-blur" style={{ boxShadow: "var(--shadow)" }}>
        <div className="mr-auto min-w-0">
          <FormMessage state={state} />
        </div>
        <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
      </div>
    </form>
  );
}
