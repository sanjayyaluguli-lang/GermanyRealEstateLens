import { CircleCheck } from "lucide-react";
import { getT } from "@/lib/i18n/server";

/** Two-panel frame for login, registration and e-mail link pages. */
export async function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  const points = [t.home.f1t, t.home.f2t, t.home.f3t];
  return (
    <div className="card mx-auto grid max-w-4xl overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-accent p-8 text-on-accent md:flex">
        <svg className="absolute inset-0 size-full opacity-[0.12]" aria-hidden>
          <defs>
            <pattern id="auth-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        <p className="relative font-mono text-[11px] tracking-[0.14em] uppercase opacity-80">GermanyRealEstateLens</p>
        <div className="relative space-y-5">
          <p className="font-display text-2xl leading-tight font-bold">{t.home.heroTitle}</p>
          <ul className="space-y-2.5 text-sm">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CircleCheck className="size-4 shrink-0 opacity-80" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-6 sm:p-10">{children}</div>
    </div>
  );
}
