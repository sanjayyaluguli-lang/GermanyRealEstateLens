// Reference data for German federal states (Bundesländer).
//
// Grunderwerbsteuer rates as last verified for 2026. States change these
// occasionally — keep `TRANSFER_TAX_VERIFIED` up to date when editing.

export const TRANSFER_TAX_VERIFIED = "2026-09";

export const BUNDESLAENDER = [
  { code: "BW", name: "Baden-Württemberg", slug: "baden-wuerttemberg", transferTaxPct: 5.0 },
  { code: "BY", name: "Bayern", slug: "bayern", transferTaxPct: 3.5 },
  { code: "BE", name: "Berlin", slug: "berlin", transferTaxPct: 6.0 },
  { code: "BB", name: "Brandenburg", slug: "brandenburg", transferTaxPct: 6.5 },
  { code: "HB", name: "Bremen", slug: "bremen", transferTaxPct: 5.5 },
  { code: "HH", name: "Hamburg", slug: "hamburg", transferTaxPct: 5.5 },
  { code: "HE", name: "Hessen", slug: "hessen", transferTaxPct: 6.0 },
  { code: "MV", name: "Mecklenburg-Vorpommern", slug: "mecklenburg-vorpommern", transferTaxPct: 6.0 },
  { code: "NI", name: "Niedersachsen", slug: "niedersachsen", transferTaxPct: 5.0 },
  { code: "NW", name: "Nordrhein-Westfalen", slug: "nordrhein-westfalen", transferTaxPct: 6.5 },
  { code: "RP", name: "Rheinland-Pfalz", slug: "rheinland-pfalz", transferTaxPct: 5.0 },
  { code: "SL", name: "Saarland", slug: "saarland", transferTaxPct: 6.5 },
  { code: "SN", name: "Sachsen", slug: "sachsen", transferTaxPct: 5.5 },
  { code: "ST", name: "Sachsen-Anhalt", slug: "sachsen-anhalt", transferTaxPct: 5.0 },
  { code: "SH", name: "Schleswig-Holstein", slug: "schleswig-holstein", transferTaxPct: 6.5 },
  { code: "TH", name: "Thüringen", slug: "thueringen", transferTaxPct: 5.0 },
] as const;

export type BundeslandCode = (typeof BUNDESLAENDER)[number]["code"];

export const BUNDESLAND_CODES = BUNDESLAENDER.map((b) => b.code) as [
  BundeslandCode,
  ...BundeslandCode[],
];

export function getBundesland(code: string) {
  return BUNDESLAENDER.find((b) => b.code === code);
}

export function transferTaxFor(code: string): number {
  return getBundesland(code)?.transferTaxPct ?? 6.5;
}

// Larger cities offered in the preference multi-select. The id is used as the
// stored value and as the Immobilienscout24 search slug.
export const CITIES = [
  { id: "berlin", name: "Berlin", state: "BE" },
  { id: "hamburg", name: "Hamburg", state: "HH" },
  { id: "muenchen", name: "München", state: "BY" },
  { id: "nuernberg", name: "Nürnberg", state: "BY" },
  { id: "augsburg", name: "Augsburg", state: "BY" },
  { id: "regensburg", name: "Regensburg", state: "BY" },
  { id: "wuerzburg", name: "Würzburg", state: "BY" },
  { id: "koeln", name: "Köln", state: "NW" },
  { id: "duesseldorf", name: "Düsseldorf", state: "NW" },
  { id: "dortmund", name: "Dortmund", state: "NW" },
  { id: "essen", name: "Essen", state: "NW" },
  { id: "duisburg", name: "Duisburg", state: "NW" },
  { id: "bochum", name: "Bochum", state: "NW" },
  { id: "bonn", name: "Bonn", state: "NW" },
  { id: "muenster", name: "Münster", state: "NW" },
  { id: "aachen", name: "Aachen", state: "NW" },
  { id: "bielefeld", name: "Bielefeld", state: "NW" },
  { id: "gelsenkirchen", name: "Gelsenkirchen", state: "NW" },
  { id: "frankfurt-am-main", name: "Frankfurt am Main", state: "HE" },
  { id: "wiesbaden", name: "Wiesbaden", state: "HE" },
  { id: "kassel", name: "Kassel", state: "HE" },
  { id: "darmstadt", name: "Darmstadt", state: "HE" },
  { id: "stuttgart", name: "Stuttgart", state: "BW" },
  { id: "karlsruhe", name: "Karlsruhe", state: "BW" },
  { id: "mannheim", name: "Mannheim", state: "BW" },
  { id: "freiburg-im-breisgau", name: "Freiburg im Breisgau", state: "BW" },
  { id: "heidelberg", name: "Heidelberg", state: "BW" },
  { id: "leipzig", name: "Leipzig", state: "SN" },
  { id: "dresden", name: "Dresden", state: "SN" },
  { id: "chemnitz", name: "Chemnitz", state: "SN" },
  { id: "hannover", name: "Hannover", state: "NI" },
  { id: "braunschweig", name: "Braunschweig", state: "NI" },
  { id: "osnabrueck", name: "Osnabrück", state: "NI" },
  { id: "bremen", name: "Bremen", state: "HB" },
  { id: "kiel", name: "Kiel", state: "SH" },
  { id: "luebeck", name: "Lübeck", state: "SH" },
  { id: "mainz", name: "Mainz", state: "RP" },
  { id: "saarbruecken", name: "Saarbrücken", state: "SL" },
  { id: "erfurt", name: "Erfurt", state: "TH" },
  { id: "jena", name: "Jena", state: "TH" },
  { id: "magdeburg", name: "Magdeburg", state: "ST" },
  { id: "halle-saale", name: "Halle (Saale)", state: "ST" },
  { id: "rostock", name: "Rostock", state: "MV" },
  { id: "potsdam", name: "Potsdam", state: "BB" },
] as const satisfies readonly { id: string; name: string; state: BundeslandCode }[];

export type CityId = (typeof CITIES)[number]["id"];

export function getCity(id: string) {
  return CITIES.find((c) => c.id === id);
}
