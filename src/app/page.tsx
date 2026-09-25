import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Calculator, Layers, ShieldCheck, UserRound } from "lucide-react";
import { MonthlyBreakdown, PriceGauge } from "@/components/charts";
import { StatusPill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { calculate, defaultInputs, GOALS, type CalcInputs } from "@/lib/calc/engine";
import { fill, formatEur } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

// A realistic example so the first screen shows what the calculator does.
const SAMPLE: CalcInputs = {
  ...defaultInputs("SN"),
  purchasePrice: 158_000,
  livingArea: 58,
  monthlyColdRent: 790,
  equity: 45_000,
  netIncome: 3_900,
  interestRatePct: 3.7,
  repaymentRatePct: 2,
};

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  const { t, lang } = await getT();
  const r = calculate(SAMPLE);
  const sentence = r.goalMet
    ? fill(t.viz.verdictAbove, { amount: formatEur(r.goalMargin, lang) })
    : fill(t.viz.verdictBelow, { amount: formatEur(-r.goalMargin, lang) });

  const steps = [
    { Icon: Calculator, title: t.nav.calculator, text: t.calc.intro },
    { Icon: UserRound, title: t.home.f1t, text: t.home.f1 },
    { Icon: Layers, title: t.home.f2t, text: t.home.f2 },
    { Icon: ShieldCheck, title: t.home.f3t, text: t.home.f3 },
  ];

  return (
    <div className="space-y-20 py-4">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
        <div className="space-y-6">
          <p className="text-sm font-semibold text-accent">{t.tagline}</p>
          <h1 className="font-display text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[56px]">
            {t.home.heroTitle}
          </h1>
          <p className="max-w-[52ch] text-lg text-ink-2">{t.home.heroText}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/calculator" className="btn px-5 py-2.5 text-[15px]">
              {t.home.ctaCalc}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/register" className="btn-secondary px-5 py-2.5 text-[15px]">
              {t.home.ctaRegister}
            </Link>
          </div>
        </div>

        <figure className="card card-pad space-y-5">
          <figcaption className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="eyebrow">{t.home.sampleLabel}</p>
              <p className="font-display text-lg leading-snug font-bold">{sentence}</p>
            </div>
            <StatusPill status={r.status} label={t.status[r.status]} size="sm" />
          </figcaption>
          <PriceGauge lang={lang} inputs={SAMPLE} r={r} />
          <div className="border-t border-line pt-4">
            <MonthlyBreakdown lang={lang} inputs={SAMPLE} r={r} />
          </div>
          <p className="text-[11px] text-muted">{t.home.sampleNote}</p>
        </figure>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-2xl!">{t.home.howTitle}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="card card-pad space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="num text-xs text-muted">0{i + 1}</span>
              </div>
              <h3 className="font-display text-base font-bold">{title}</h3>
              <p className="text-[13px] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-6">
        <h2 className="h1 text-2xl!">{t.home.goalsTitle}</h2>
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {GOALS.map((g) => (
            <div key={g} className="bg-surface p-6">
              <p className="text-[15px] font-semibold">{t.goals[g]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
