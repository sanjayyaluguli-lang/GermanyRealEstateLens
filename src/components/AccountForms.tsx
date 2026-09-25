"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import type { FormState } from "@/app/actions/auth";
import { addFavourite, changePassword, deleteAccount } from "@/app/actions/data";
import { BUNDESLAENDER } from "@/lib/calc/regions";
import { getDictionary, type Lang } from "@/lib/i18n";
import { FormMessage, SubmitButton, submitWithoutReset } from "./ui";

const stripUnit = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

export function ChangePasswordForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current">
            {t.auth.currentPassword}
          </label>
          <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="next">
            {t.auth.newPassword}
          </label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required className="input" />
          <p className="hint">{t.auth.passwordHint}</p>
        </div>
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton className="btn-secondary">
          <KeyRound className="size-4" aria-hidden />
          {t.account.changePassword}
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteAccountForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, undefined);
  return (
    <form action={action} className="grid gap-4">
      <p className="text-[13px] text-ink-2">{t.account.dangerText}</p>
      <div className="max-w-sm">
        <label className="label" htmlFor="delete-password">
          {t.auth.password}
        </label>
        <input id="delete-password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton className="btn-danger">
          <Trash2 className="size-4" aria-hidden />
          {t.account.deleteConfirm}
        </SubmitButton>
      </div>
    </form>
  );
}

export function AddFavouriteForm({ lang, defaultState }: { lang: Lang; defaultState: string }) {
  const t = getDictionary(lang);
  const [state, action, pending] = useActionState<FormState, FormData>(addFavourite, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const num = (id: string, name: string, label: string, unit: string, min = 0) => (
    <div>
      <label className="label" htmlFor={id}>
        {stripUnit(label)}
      </label>
      <div className="field-affix">
        <input id={id} name={name} type="number" inputMode="decimal" min={min} required className="input" />
        <span className="affix">{unit}</span>
      </div>
    </div>
  );

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(action)} className="card card-pad grid gap-4">
      <h2 className="h2 flex items-center gap-2 text-base">
        <Plus className="size-4 text-accent" aria-hidden />
        {t.favourites.add}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="expose">
            {t.favourites.exposeInput}
          </label>
          <input id="expose" name="expose" required placeholder="https://www.immobilienscout24.de/expose/123456789" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="title">
            {t.favourites.titleLabel}
          </label>
          <input id="title" name="title" required maxLength={160} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="fav-bundesland">
            {t.calc.bundesland}
          </label>
          <select id="fav-bundesland" name="bundesland" defaultValue={defaultState} className="input">
            {BUNDESLAENDER.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {num("fav-price", "purchasePrice", t.calc.purchasePrice, "€")}
        {num("fav-rent", "monthlyColdRent", t.calc.monthlyColdRent, "€/Mon.")}
        {num("fav-area", "livingArea", t.calc.livingArea, "m²", 1)}
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
      </div>
    </form>
  );
}
