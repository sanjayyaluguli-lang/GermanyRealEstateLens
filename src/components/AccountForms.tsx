"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/actions/auth";
import { addFavourite, changePassword, deleteAccount } from "@/app/actions/data";
import { BUNDESLAENDER } from "@/lib/calc/regions";
import { getDictionary, type Lang } from "@/lib/i18n";
import { FormMessage, SubmitButton, submitWithoutReset } from "./ui";

export function ChangePasswordForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="card space-y-3">
      <h2 className="h2">{t.account.changePassword}</h2>
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
        <p className="mt-1 text-xs text-slate-500">{t.auth.passwordHint}</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary">{t.common.save}</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, undefined);
  return (
    <form action={action} className="card space-y-3 border-red-200">
      <h2 className="h2 text-red-800">{t.account.danger}</h2>
      <p className="text-sm text-slate-600">{t.account.dangerText}</p>
      <div>
        <label className="label" htmlFor="delete-password">
          {t.auth.password}
        </label>
        <input
          id="delete-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-danger">{t.account.deleteConfirm}</SubmitButton>
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
  return (
    <form ref={formRef} onSubmit={submitWithoutReset(action)} className="card grid gap-3 sm:grid-cols-2">
      <h2 className="h2 sm:col-span-2">{t.favourites.add}</h2>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="expose">
          {t.favourites.exposeInput}
        </label>
        <input
          id="expose"
          name="expose"
          required
          placeholder="https://www.immobilienscout24.de/expose/123456789"
          className="input"
        />
      </div>
      <div className="sm:col-span-2">
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
      <div>
        <label className="label" htmlFor="fav-price">
          {t.calc.purchasePrice}
        </label>
        <input id="fav-price" name="purchasePrice" type="number" min={0} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="fav-rent">
          {t.calc.monthlyColdRent}
        </label>
        <input id="fav-rent" name="monthlyColdRent" type="number" min={0} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="fav-area">
          {t.calc.livingArea}
        </label>
        <input id="fav-area" name="livingArea" type="number" min={1} required className="input" />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage state={state} />
        <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
      </div>
    </form>
  );
}
