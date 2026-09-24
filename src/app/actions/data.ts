"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import {
  destroyAllSessions,
  destroySession,
  getCurrentUser,
  hashPassword,
  requireUser,
  createSession,
  verifyPassword,
} from "@/lib/auth/session";
import { calcInputSchema, GOALS, RISK_LEVELS } from "@/lib/calc/engine";
import { BUNDESLAND_CODES, CITIES, transferTaxFor } from "@/lib/calc/regions";
import { getProfile, inputsFromProfile, setLanguage, updateProfile } from "@/lib/data/profile";
import { createScenario, deleteScenario, updateScenario } from "@/lib/data/scenarios";
import { createFavourite, deleteFavourite } from "@/lib/data/favourites";
import { parseExposeId } from "@/lib/is24";
import { isLang, LANG_COOKIE } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { log } from "@/lib/logger";
import type { FormState } from "./auth";

const num = (min: number, max: number) => z.coerce.number().finite().min(min).max(max);
const cityIds = CITIES.map((c) => c.id) as [string, ...string[]];

// ---------------------------------------------------------------- language

export async function switchLanguage(form: FormData) {
  const lang = form.get("lang");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", sameSite: "lax", maxAge: 365 * 24 * 3600 });
  const user = await getCurrentUser();
  if (user) await setLanguage(user.id, lang);
  revalidatePath("/", "layout");
}

// ----------------------------------------------------------------- profile

const profileSchema = z.object({
  consent: z.boolean(),
  equity: num(0, 100_000_000).optional(),
  netIncome: num(0, 10_000_000).optional(),
  preferredStates: z.array(z.enum(BUNDESLAND_CODES)).max(16),
  preferredCities: z.array(z.enum(cityIds)).max(50),
  riskTolerance: z.enum(RISK_LEVELS),
  defaultGoal: z.enum(GOALS),
  interestRatePct: num(0, 20),
  repaymentRatePct: num(0, 20),
  fixedRateYears: z.coerce.number().int().min(1).max(40),
  vacancyBufferPct: num(0, 50),
  maintenancePerSqmYear: num(0, 200),
  brokerPct: num(0, 10),
  language: z.enum(["de", "en"]),
});

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const blankToUndef = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);
  const parsed = profileSchema.safeParse({
    consent: form.get("consent") === "on",
    equity: blankToUndef(form.get("equity")),
    netIncome: blankToUndef(form.get("netIncome")),
    preferredStates: form.getAll("preferredStates"),
    preferredCities: form.getAll("preferredCities"),
    riskTolerance: form.get("riskTolerance"),
    defaultGoal: form.get("defaultGoal"),
    interestRatePct: form.get("interestRatePct"),
    repaymentRatePct: form.get("repaymentRatePct"),
    fixedRateYears: form.get("fixedRateYears"),
    vacancyBufferPct: form.get("vacancyBufferPct"),
    maintenancePerSqmYear: form.get("maintenancePerSqmYear"),
    brokerPct: form.get("brokerPct"),
    language: form.get("language"),
  });
  if (!parsed.success) return { error: (await getT()).t.common.invalidInput };
  const d = parsed.data;
  const hadConsent = (await getProfile(user.id)).financialConsentAt !== null;

  await updateProfile(user.id, {
    ...d,
    financials:
      d.consent && d.equity !== undefined && d.netIncome !== undefined
        ? { equity: d.equity, netIncome: d.netIncome }
        : null,
  });
  (await cookies()).set(LANG_COOKIE, d.language, { path: "/", sameSite: "lax", maxAge: 365 * 24 * 3600 });
  log.info("profile.updated", { userId: user.id, consent: d.consent });
  revalidatePath("/", "layout");

  const { t } = await getT();
  return { ok: hadConsent && !d.consent ? t.profile.consentWithdrawn : t.common.updated };
}

// --------------------------------------------------------------- scenarios

export type SaveScenarioState = (FormState & { id?: string }) | undefined;

export async function saveScenario(_: SaveScenarioState, form: FormData): Promise<SaveScenarioState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t.calc.loginToSave };
  const profile = await getProfile(user.id);
  if (!profile.financialConsentAt) return { error: t.calc.consentToSave };

  const name = z.string().trim().min(1).max(120).safeParse(form.get("name"));
  let rawInputs: unknown;
  try {
    rawInputs = JSON.parse(String(form.get("inputs") ?? ""));
  } catch {
    rawInputs = null;
  }
  const inputs = calcInputSchema.safeParse(rawInputs);
  if (!name.success || !inputs.success) return { error: t.common.invalidInput };

  const overwriteId = form.get("mode") === "overwrite" ? String(form.get("scenarioId") ?? "") : "";
  let id: string | null;
  if (overwriteId && z.string().uuid().safeParse(overwriteId).success) {
    id = await updateScenario(user.id, overwriteId, name.data, inputs.data);
    if (!id) return { error: t.scenarios.notFound };
  } else {
    id = await createScenario(user.id, name.data, inputs.data);
  }
  log.info("scenario.saved", { userId: user.id, scenarioId: id });
  revalidatePath("/dashboard");
  revalidatePath("/scenarios");
  return { ok: t.calc.saved, id };
}

export async function removeScenario(form: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (id.success) await deleteScenario(user.id, id.data);
  revalidatePath("/scenarios");
  revalidatePath("/dashboard");
  redirect("/scenarios");
}

// -------------------------------------------------------------- favourites

export async function addFavourite(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getT();
  const profile = await getProfile(user.id);
  if (!profile.financialConsentAt) return { error: t.calc.consentToSave };

  const exposeId = parseExposeId(String(form.get("expose") ?? ""));
  if (!exposeId) return { error: t.favourites.invalidExpose };
  const title = z.string().trim().min(1).max(160).safeParse(form.get("title"));
  const bundesland = String(form.get("bundesland") ?? "");
  const inputs = calcInputSchema.safeParse({
    ...inputsFromProfile(profile),
    bundesland,
    // Transfer tax follows the listing's Bundesland, not the profile default.
    transferTaxPct: transferTaxFor(bundesland),
    purchasePrice: form.get("purchasePrice"),
    monthlyColdRent: form.get("monthlyColdRent"),
    livingArea: form.get("livingArea"),
  });
  if (!title.success || !inputs.success) return { error: t.common.invalidInput };
  await createFavourite(user.id, exposeId, title.data, inputs.data);
  log.info("favourite.added", { userId: user.id });
  revalidatePath("/favourites");
  return { ok: t.common.updated };
}

export async function removeFavourite(form: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (id.success) await deleteFavourite(user.id, id.data);
  revalidatePath("/favourites");
}

// ----------------------------------------------------------------- account

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getT();
  const parsed = z
    .object({ current: z.string().min(1).max(256), next: z.string().min(10).max(256) })
    .safeParse({ current: form.get("current"), next: form.get("next") });
  if (!parsed.success) return { error: `${t.common.invalidInput} ${t.auth.passwordHint}` };
  const [row] = await getDb().select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!row || !(await verifyPassword(row.passwordHash, parsed.data.current))) return { error: t.account.wrongPassword };
  await getDb()
    .update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.next), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await destroyAllSessions(user.id);
  await createSession(user.id);
  log.info("auth.password_changed", { userId: user.id });
  return { ok: t.account.passwordChanged };
}

export async function logoutEverywhere() {
  const user = await requireUser();
  await destroyAllSessions(user.id);
  await destroySession();
  redirect("/login");
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getT();
  const [row] = await getDb().select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!row || !(await verifyPassword(row.passwordHash, String(form.get("password") ?? ""))))
    return { error: t.account.wrongPassword };
  // Profile, sessions, tokens, scenarios and favourites are removed by ON DELETE CASCADE.
  await getDb().delete(schema.users).where(eq(schema.users.id, user.id));
  await destroySession();
  log.info("account.deleted", { userId: user.id });
  redirect("/?deleted=1");
}
