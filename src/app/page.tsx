import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");
  const { t } = await getT();
  const features = [
    [t.home.f1t, t.home.f1],
    [t.home.f2t, t.home.f2],
    [t.home.f3t, t.home.f3],
  ];
  return (
    <div className="space-y-12 py-6">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-medium text-emerald-800">{t.tagline}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{t.home.heroTitle}</h1>
        <p className="text-lg text-slate-600">{t.home.heroText}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/calculator" className="btn">
            {t.home.ctaCalc}
          </Link>
          <Link href="/register" className="btn-secondary">
            {t.home.ctaRegister}
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(([title, text]) => (
          <div key={title} className="card">
            <h2 className="h2">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
