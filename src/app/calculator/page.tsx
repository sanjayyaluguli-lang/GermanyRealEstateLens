import { Calculator, type SaveMode } from "@/components/Calculator";
import { getCurrentUser } from "@/lib/auth/session";
import { calcInputSchema, type CalcInputs } from "@/lib/calc/engine";
import { transferTaxFor } from "@/lib/calc/regions";
import { getProfile, inputsFromProfile } from "@/lib/data/profile";
import { getScenario } from "@/lib/data/scenarios";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Rechner · GermanyRealEstateLens" };

// Query parameters that may pre-fill the calculator (e.g. from a favourite).
const PREFILL_KEYS = ["bundesland", "purchasePrice", "monthlyColdRent", "livingArea"] as const;

export default async function CalculatorPage({ searchParams }: PageProps<"/calculator">) {
  const sp = await searchParams;
  const [{ lang }, user] = await Promise.all([getT(), getCurrentUser()]);
  const profile = user ? await getProfile(user.id) : null;

  let initial: CalcInputs = inputsFromProfile(profile);
  let loaded: { id: string; name: string } | null = null;

  const scenarioId = typeof sp.scenario === "string" ? sp.scenario : null;
  if (user && scenarioId && /^[0-9a-f-]{36}$/i.test(scenarioId)) {
    const scenario = await getScenario(user.id, scenarioId);
    if (scenario) {
      initial = scenario.inputs;
      loaded = { id: scenario.id, name: scenario.name };
    }
  } else {
    const overrides: Record<string, string> = {};
    for (const key of PREFILL_KEYS) if (typeof sp[key] === "string") overrides[key] = sp[key];
    if (Object.keys(overrides).length > 0) {
      const merged = calcInputSchema.safeParse({ ...initial, ...overrides });
      if (merged.success) {
        initial = merged.data;
        if (overrides.bundesland) initial.transferTaxPct = transferTaxFor(initial.bundesland);
      }
    }
  }

  const saveMode: SaveMode = !user ? "anonymous" : profile?.financialConsentAt ? "enabled" : "needsConsent";

  return (
    <Calculator
      key={loaded?.id ?? "new"}
      lang={lang}
      initial={initial}
      saveMode={saveMode}
      loaded={loaded}
      prefilledFromProfile={Boolean(profile)}
    />
  );
}
