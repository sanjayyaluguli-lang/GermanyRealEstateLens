import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { decryptJson, encryptJson } from "../crypto";
import { defaultInputs, type CalcInputs, type Goal, type RiskTolerance } from "../calc/engine";
import { getCity, transferTaxFor, type BundeslandCode } from "../calc/regions";
import type { Lang } from "../i18n";

export interface Financials {
  equity: number;
  netIncome: number;
}

export interface Profile {
  financials: Financials | null;
  financialConsentAt: Date | null;
  preferredStates: BundeslandCode[];
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
  updatedAt: Date;
}

export async function ensureProfile(userId: string, language: Lang = "de") {
  await getDb().insert(schema.profiles).values({ userId, language }).onConflictDoNothing();
}

export async function getProfile(userId: string): Promise<Profile> {
  let row = (await getDb().select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1))[0];
  if (!row) {
    await ensureProfile(userId);
    row = (await getDb().select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1))[0];
  }
  return {
    financials: row.financialEnc && row.financialConsentAt ? decryptJson<Financials>(row.financialEnc) : null,
    financialConsentAt: row.financialConsentAt,
    preferredStates: row.preferredStates as BundeslandCode[],
    preferredCities: row.preferredCities,
    riskTolerance: row.riskTolerance,
    defaultGoal: row.defaultGoal,
    interestRatePct: row.interestRatePct,
    repaymentRatePct: row.repaymentRatePct,
    fixedRateYears: row.fixedRateYears,
    vacancyBufferPct: row.vacancyBufferPct,
    maintenancePerSqmYear: row.maintenancePerSqmYear,
    brokerPct: row.brokerPct,
    language: row.language,
    updatedAt: row.updatedAt,
  };
}

export type ProfileUpdate = Omit<Profile, "financials" | "financialConsentAt" | "updatedAt"> & {
  consent: boolean;
  financials: Financials | null;
};

export async function updateProfile(userId: string, p: ProfileUpdate) {
  await ensureProfile(userId);
  const current = await getDb()
    .select({ consentAt: schema.profiles.financialConsentAt })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId));
  const consentAt = p.consent ? (current[0]?.consentAt ?? new Date()) : null;
  await getDb()
    .update(schema.profiles)
    .set({
      // Withdrawing consent erases the stored financial data.
      financialEnc: p.consent && p.financials ? encryptJson(p.financials) : null,
      financialConsentAt: consentAt,
      preferredStates: p.preferredStates,
      preferredCities: p.preferredCities,
      riskTolerance: p.riskTolerance,
      defaultGoal: p.defaultGoal,
      interestRatePct: p.interestRatePct,
      repaymentRatePct: p.repaymentRatePct,
      fixedRateYears: p.fixedRateYears,
      vacancyBufferPct: p.vacancyBufferPct,
      maintenancePerSqmYear: p.maintenancePerSqmYear,
      brokerPct: p.brokerPct,
      language: p.language,
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.userId, userId));
}

export async function setLanguage(userId: string, language: Lang) {
  await ensureProfile(userId, language);
  await getDb().update(schema.profiles).set({ language }).where(eq(schema.profiles.userId, userId));
}

/** Calculator defaults derived from the profile (profile values win). */
export function inputsFromProfile(profile: Profile | null): CalcInputs {
  const firstCity = profile?.preferredCities.map((id) => getCity(id)).find(Boolean);
  const state = firstCity?.state ?? profile?.preferredStates[0] ?? "NW";
  const base = defaultInputs(state);
  if (!profile) return base;
  return {
    ...base,
    equity: profile.financials?.equity ?? base.equity,
    netIncome: profile.financials?.netIncome ?? base.netIncome,
    interestRatePct: profile.interestRatePct,
    repaymentRatePct: profile.repaymentRatePct,
    fixedRateYears: profile.fixedRateYears,
    vacancyBufferPct: profile.vacancyBufferPct,
    maintenancePerSqmYear: profile.maintenancePerSqmYear,
    brokerPct: profile.brokerPct,
    transferTaxPct: transferTaxFor(state),
    goal: profile.defaultGoal,
    riskTolerance: profile.riskTolerance,
  };
}
