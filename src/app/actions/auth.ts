"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import {
  burnPasswordCheck,
  createSession,
  destroyAllSessions,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/session";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { allow } from "@/lib/rate-limit";
import { appUrl, sendMail } from "@/lib/mail";
import { ensureProfile } from "@/lib/data/profile";
import { getT } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { log } from "@/lib/logger";
import { PRIVACY_VERSION } from "@/lib/privacy";

// `email` is echoed back so the field survives React's post-action form reset.
export type FormState = { error?: string; ok?: string; email?: string } | undefined;

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(10).max(256);

function safeNext(next: FormDataEntryValue | null) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/dashboard";
}

async function findUserByEmail(addr: string) {
  const rows = await getDb().select().from(schema.users).where(eq(schema.users.email, addr)).limit(1);
  return rows[0] ?? null;
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const { t, lang } = await getT();
  const parsed = z
    .object({ email, password, acceptPrivacy: z.literal("on") })
    .safeParse({ email: form.get("email"), password: form.get("password"), acceptPrivacy: form.get("acceptPrivacy") });
  const typed = String(form.get("email") ?? "").slice(0, 254);
  if (!parsed.success) {
    const privacyMissing = parsed.error.issues.some((i) => i.path[0] === "acceptPrivacy");
    return {
      error: privacyMissing ? t.auth.mustAcceptPrivacy : `${t.common.invalidInput} ${t.auth.passwordHint}`,
      email: typed,
    };
  }
  if (!(await allow("register", parsed.data.email))) return { error: t.common.rateLimited, email: typed };

  if (await findUserByEmail(parsed.data.email)) return { error: t.auth.emailTaken, email: typed };

  const [user] = await getDb()
    .insert(schema.users)
    .values({
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      privacyAcceptedAt: new Date(),
      privacyVersion: PRIVACY_VERSION,
    })
    .onConflictDoNothing()
    .returning({ id: schema.users.id });
  if (!user) return { error: t.auth.emailTaken, email: typed };

  await ensureProfile(user.id, lang);
  await createSession(user.id);
  log.info("auth.registered", { userId: user.id });
  redirect("/profile?welcome=1");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  const parsed = z
    .object({ email, password: z.string().min(1).max(256) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  const typed = String(form.get("email") ?? "").slice(0, 254);
  if (!parsed.success) return { error: t.auth.invalidCredentials, email: typed };
  if (!(await allow("login", parsed.data.email))) return { error: t.common.rateLimited, email: typed };

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    await burnPasswordCheck(parsed.data.password);
    return { error: t.auth.invalidCredentials, email: typed };
  }
  if (!(await verifyPassword(user.passwordHash, parsed.data.password))) {
    log.warn("auth.login_failed", { userId: user.id });
    return { error: t.auth.invalidCredentials, email: typed };
  }
  await createSession(user.id);
  log.info("auth.login", { userId: user.id });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: t.common.invalidInput };
  if (!(await allow("passwordReset", parsed.data))) return { error: t.common.rateLimited };

  const user = await findUserByEmail(parsed.data);
  if (user) {
    const token = await issueToken(user.id, "password_reset");
    const link = appUrl(`/reset-password?token=${encodeURIComponent(token)}`);
    try {
      await sendMail(user.email, t.auth.mailResetSubject, fill(t.auth.mailResetBody, { link }));
    } catch (err) {
      log.error("auth.reset_mail_failed", err, { userId: user.id });
    }
  }
  // Same answer whether or not the account exists (no account enumeration).
  return { ok: t.auth.linkSent };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  if (!(await allow("tokenRedeem"))) return { error: t.common.rateLimited };
  const parsed = z
    .object({ token: z.string().min(20).max(200), password })
    .safeParse({ token: form.get("token"), password: form.get("password") });
  if (!parsed.success) return { error: `${t.common.invalidInput} ${t.auth.passwordHint}` };

  const userId = await consumeToken(parsed.data.token, "password_reset");
  if (!userId) return { error: t.auth.resetInvalid };

  await getDb()
    .update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  await destroyAllSessions(userId);
  log.info("auth.password_reset", { userId });
  redirect("/login?reset=1");
}

export async function requestMagicLink(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: t.common.invalidInput };
  if (!(await allow("magicLink", parsed.data))) return { error: t.common.rateLimited };

  const user = await findUserByEmail(parsed.data);
  if (user) {
    const token = await issueToken(user.id, "magic_link");
    const link = appUrl(`/magic-link/verify?token=${encodeURIComponent(token)}`);
    try {
      await sendMail(user.email, t.auth.mailMagicSubject, fill(t.auth.mailMagicBody, { link }));
    } catch (err) {
      log.error("auth.magic_mail_failed", err, { userId: user.id });
    }
  }
  return { ok: t.auth.linkSent };
}

// The e-mailed link opens a confirmation page that POSTs here, so link
// scanners in mail clients cannot burn the single-use token with a GET.
export async function redeemMagicLink(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  if (!(await allow("tokenRedeem"))) return { error: t.common.rateLimited };
  const token = z.string().min(20).max(200).safeParse(form.get("token"));
  if (!token.success) return { error: t.auth.resetInvalid };
  const userId = await consumeToken(token.data, "magic_link");
  if (!userId) return { error: t.auth.resetInvalid };
  await createSession(userId);
  log.info("auth.magic_login", { userId });
  redirect("/dashboard");
}
