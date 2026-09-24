import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { logout } from "./actions/auth";
import { switchLanguage } from "./actions/data";

export const metadata: Metadata = {
  title: "GermanyRealEstateLens",
  description: "Financing calculator and research assistant for buy-to-let property in Germany.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ t, lang }, user] = await Promise.all([getT(), getCurrentUser()]);

  return (
    <html lang={lang} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="font-semibold text-emerald-800">
              {t.appName}
            </Link>
            <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Link href="/calculator" className="hover:text-emerald-800">
                {t.nav.calculator}
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="hover:text-emerald-800">
                    {t.nav.dashboard}
                  </Link>
                  <Link href="/scenarios" className="hover:text-emerald-800">
                    {t.nav.scenarios}
                  </Link>
                  <Link href="/favourites" className="hover:text-emerald-800">
                    {t.nav.favourites}
                  </Link>
                  <Link href="/profile" className="hover:text-emerald-800">
                    {t.nav.profile}
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <form action={switchLanguage} className="flex overflow-hidden rounded border border-slate-300">
                {(["de", "en"] as const).map((l) => (
                  <button
                    key={l}
                    name="lang"
                    value={l}
                    className={`px-2 py-1 text-xs uppercase ${l === lang ? "bg-slate-800 text-white" : "bg-white"}`}
                    aria-pressed={l === lang}
                  >
                    {l}
                  </button>
                ))}
              </form>
              {user ? (
                <>
                  <Link href="/account" className="hover:text-emerald-800">
                    {t.nav.account}
                  </Link>
                  <form action={logout}>
                    <button className="btn-secondary px-3 py-1">{t.nav.logout}</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-emerald-800">
                    {t.nav.login}
                  </Link>
                  <Link href="/register" className="btn px-3 py-1">
                    {t.nav.register}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white text-xs text-slate-500">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-4">
            <span>© {new Date().getFullYear()} {t.appName}</span>
            <Link href="/privacy" className="hover:underline">
              {t.nav.privacy}
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
