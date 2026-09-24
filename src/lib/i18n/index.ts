import { de, type Dictionary } from "./de";
import { en } from "./en";

export type Lang = "de" | "en";
export const LANGS: Lang[] = ["de", "en"];
export const LANG_COOKIE = "grl_lang";

export function getDictionary(lang: Lang): Dictionary {
  return lang === "en" ? en : de;
}

export function isLang(v: unknown): v is Lang {
  return v === "de" || v === "en";
}

export function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function locale(lang: Lang) {
  return lang === "en" ? "en-GB" : "de-DE";
}

export function formatEur(n: number | null | undefined, lang: Lang, digits = 0) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale(lang), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatNum(n: number | null | undefined, lang: Lang, digits = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: digits }).format(n);
}

export type { Dictionary };
