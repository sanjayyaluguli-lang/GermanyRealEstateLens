"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  login,
  redeemMagicLink,
  register,
  requestMagicLink,
  requestPasswordReset,
  resetPassword,
  type FormState,
} from "@/app/actions/auth";
import { getDictionary, type Lang } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "./ui";

function EmailField({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="label" htmlFor="email">
        {label}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        defaultValue={defaultValue}
        className="input"
      />
    </div>
  );
}

function PasswordField({ label, hint, autoComplete }: { label: string; hint?: string; autoComplete: string }) {
  return (
    <div>
      <label className="label" htmlFor="password">
        {label}
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete={autoComplete}
        required
        minLength={autoComplete === "new-password" ? 10 : 1}
        maxLength={256}
        className="input"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function LoginForm({ lang, next, notice }: { lang: Lang; next?: string; notice?: string }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(login, notice ? { ok: notice } : undefined);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="h1">{t.auth.loginTitle}</h1>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <EmailField label={t.auth.email} defaultValue={state?.email} />
      <PasswordField label={t.auth.password} autoComplete="current-password" />
      <SubmitButton className="btn w-full">{t.auth.submitLogin}</SubmitButton>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/forgot-password" className="link">
          {t.auth.forgot}
        </Link>
        <Link href="/magic-link" className="link">
          {t.auth.magicLink}
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="link">
          {t.nav.register}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(register, undefined);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="h1">{t.auth.registerTitle}</h1>
      <FormMessage state={state} />
      <EmailField label={t.auth.email} defaultValue={state?.email} />
      <PasswordField label={t.auth.password} hint={t.auth.passwordHint} autoComplete="new-password" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptPrivacy" required className="mt-1" />
        <span>
          {t.auth.acceptPrivacy}{" "}
          <Link href="/privacy" target="_blank" className="link">
            ({t.nav.privacy})
          </Link>
        </span>
      </label>
      <SubmitButton className="btn w-full">{t.auth.submitRegister}</SubmitButton>
      <p className="text-sm text-slate-600">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="link">
          {t.nav.login}
        </Link>
      </p>
    </form>
  );
}

export function EmailLinkForm({ lang, kind }: { lang: Lang; kind: "reset" | "magic" }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(
    kind === "reset" ? requestPasswordReset : requestMagicLink,
    undefined,
  );
  return (
    <form action={action} className="card space-y-4">
      <h1 className="h1">{kind === "reset" ? t.auth.forgotTitle : t.auth.magicTitle}</h1>
      <p className="text-sm text-slate-600">{kind === "reset" ? t.auth.forgotText : t.auth.magicText}</p>
      <FormMessage state={state} />
      <EmailField label={t.auth.email} defaultValue={state?.email} />
      <SubmitButton className="btn w-full">{t.auth.sendLink}</SubmitButton>
      <Link href="/login" className="link block text-sm">
        ← {t.nav.login}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ lang, token }: { lang: Lang; token: string }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(resetPassword, undefined);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="h1">{t.auth.resetTitle}</h1>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <PasswordField label={t.auth.newPassword} hint={t.auth.passwordHint} autoComplete="new-password" />
      <SubmitButton className="btn w-full">{t.auth.resetSubmit}</SubmitButton>
    </form>
  );
}

export function MagicLinkConfirmForm({ lang, token }: { lang: Lang; token: string }) {
  const t = getDictionary(lang);
  const [state, action] = useActionState<FormState, FormData>(redeemMagicLink, undefined);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="h1">{t.auth.magicConfirmTitle}</h1>
      <p className="text-sm text-slate-600">{t.auth.magicConfirmText}</p>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton className="btn w-full">{t.auth.magicConfirm}</SubmitButton>
    </form>
  );
}
