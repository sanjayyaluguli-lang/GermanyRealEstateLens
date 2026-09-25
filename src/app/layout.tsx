import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Schibsted_Grotesk } from "next/font/google";
import { LogOut } from "lucide-react";
import "./globals.css";
import { Brand } from "@/components/Brand";
import { NavLinks, type NavItem } from "@/components/NavLinks";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary, Lang } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { logout } from "./actions/auth";
import { switchLanguage } from "./actions/data";

// Fonts are downloaded at build time and served from this app (no request to
// Google at runtime, which keeps visitors' IPs away from third parties).
const display = Schibsted_Grotesk({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-schibsted" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "GermanyRealEstateLens",
  description: "Financing calculator and research assistant for buy-to-let property in Germany.",
};

function LanguageSwitch({ lang }: { lang: Lang }) {
  return (
    <form action={switchLanguage} className="inline-flex rounded-lg border border-line bg-surface p-0.5" aria-label="Sprache / Language">
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          name="lang"
          value={l}
          aria-pressed={l === lang}
          className={`rounded-md px-2 py-1 font-mono text-[11px] font-medium uppercase transition-colors ${
            l === lang ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </form>
  );
}

function Footer({ t }: { t: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-5 text-xs text-muted sm:px-6">
        <span>© {new Date().getFullYear()} GermanyRealEstateLens</span>
        <Link href="/privacy" className="hover:text-ink">
          {t.nav.privacy}
        </Link>
        <span>{t.footer.noAdvice}</span>
      </div>
    </footer>
  );
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ t, lang }, user] = await Promise.all([getT(), getCurrentUser()]);
  const fontVars = `${display.variable} ${sans.variable} ${mono.variable}`;

  if (!user) {
    return (
      <html lang={lang} className={`h-full ${fontVars}`}>
        <body className="flex min-h-full flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
              <Brand href="/" />
              <nav className="flex-1 text-sm">
                <Link href="/calculator" className="btn-ghost">
                  {t.nav.calculator}
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <LanguageSwitch lang={lang} />
                <Link href="/login" className="btn-ghost">
                  {t.nav.login}
                </Link>
                <Link href="/register" className="btn">
                  {t.nav.register}
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <Footer t={t} />
        </body>
      </html>
    );
  }

  const items: NavItem[] = [
    { href: "/dashboard", label: t.nav.dashboard, icon: "dashboard" },
    { href: "/calculator", label: t.nav.calculator, icon: "calculator" },
    { href: "/scenarios", label: t.nav.scenarios, icon: "scenarios" },
    { href: "/favourites", label: t.nav.favourites, icon: "favourites" },
    { href: "/profile", label: t.nav.profile, icon: "profile" },
    { href: "/account", label: t.nav.account, icon: "account" },
  ];

  return (
    <html lang={lang} className={`h-full ${fontVars}`}>
      <body className="min-h-full lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <nav
          aria-label="Hauptnavigation"
          className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface px-4 py-5 lg:flex"
        >
          <div className="px-1">
            <Brand href="/dashboard" />
          </div>
          <NavLinks items={items} orientation="vertical" />
          <div className="mt-auto grid gap-3 border-t border-line pt-4">
            <p className="truncate px-1 text-xs text-muted" title={user.email}>
              {user.email}
            </p>
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitch lang={lang} />
              <form action={logout}>
                <button className="btn-ghost btn-sm">
                  <LogOut className="size-4" aria-hidden />
                  {t.nav.logout}
                </button>
              </form>
            </div>
          </div>
        </nav>

        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <Brand href="/dashboard" />
            <div className="flex items-center gap-1">
              <LanguageSwitch lang={lang} />
              <form action={logout}>
                <button className="btn-ghost btn-sm" aria-label={t.nav.logout}>
                  <LogOut className="size-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
          <div className="px-2 py-2">
            <NavLinks items={items} orientation="horizontal" />
          </div>
        </header>

        <div className="flex min-h-screen min-w-0 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <Footer t={t} />
        </div>
      </body>
    </html>
  );
}
