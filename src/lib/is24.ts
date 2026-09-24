// Immobilienscout24 deep-link helpers. IS24 has no public search API, so we
// only build URLs to their public search/expose pages. The path format was
// verified manually; if IS24 changes it, only this file needs updating.

import { getBundesland, getCity } from "./calc/regions";

const BASE = "https://www.immobilienscout24.de";

export type PropertyKind = "wohnung" | "haus";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SearchLinkOptions {
  bundesland: string;
  cityId?: string;
  kind?: PropertyKind;
  maxPrice?: number | null;
  minArea?: number | null;
}

export function buildSearchUrl(opts: SearchLinkOptions): string {
  const state = getBundesland(opts.bundesland);
  if (!state) throw new Error(`Unknown Bundesland: ${opts.bundesland}`);
  const city = opts.cityId ? getCity(opts.cityId) : undefined;
  const kind = opts.kind ?? "wohnung";

  const segments = ["Suche", "de", state.slug];
  if (city) segments.push(city.id);
  // City states (Berlin, Hamburg, Bremen) repeat their name as the city segment.
  else if (["BE", "HH", "HB"].includes(state.code)) segments.push(state.slug);
  segments.push(`${kind}-kaufen`);

  const params = new URLSearchParams();
  if (opts.maxPrice && opts.maxPrice > 0) params.set("price", `-${Math.floor(opts.maxPrice)}.0`);
  if (opts.minArea && opts.minArea > 0) params.set("livingspace", `${Math.floor(opts.minArea)}.0-`);
  const qs = params.toString();
  return `${BASE}/${segments.join("/")}${qs ? `?${qs.replace(/%2C/g, ",")}` : ""}`;
}

/** Accepts a bare expose ID or any IS24 expose URL and returns the numeric ID. */
export function parseExposeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{5,12}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (!/(^|\.)immobilienscout24\.de$/.test(url.hostname)) return null;
    const match = url.pathname.match(/\/expose\/(\d{5,12})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function exposeUrl(id: string): string {
  return `${BASE}/expose/${encodeURIComponent(id)}`;
}
