import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { requireUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/data/profile";
import { getT } from "@/lib/i18n/server";

export default async function ProfilePage() {
  const user = await requireUser();
  const [{ t, lang }, p] = await Promise.all([getT(), getProfile(user.id)]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t.nav.profile} title={t.profile.title} lede={t.profile.intro} />
      <ProfileForm
        lang={lang}
        initial={{
          consent: p.financialConsentAt !== null,
          equity: p.financials?.equity ?? null,
          netIncome: p.financials?.netIncome ?? null,
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
        }}
      />
    </div>
  );
}
