import { describe, expect, it } from "vitest";
import { buildSearchUrl, exposeUrl, parseExposeId, slugify } from "./is24";

describe("is24", () => {
  it("slugifies German names", () => {
    expect(slugify("Düsseldorf")).toBe("duesseldorf");
    expect(slugify("Frankfurt am Main")).toBe("frankfurt-am-main");
    expect(slugify("Thüringen")).toBe("thueringen");
    expect(slugify("Gießen")).toBe("giessen");
  });

  it("builds search URLs", () => {
    expect(buildSearchUrl({ bundesland: "BY", cityId: "muenchen", maxPrice: 350000.7 })).toBe(
      "https://www.immobilienscout24.de/Suche/de/bayern/muenchen/wohnung-kaufen?price=-350000.0",
    );
    expect(buildSearchUrl({ bundesland: "BE" })).toBe(
      "https://www.immobilienscout24.de/Suche/de/berlin/berlin/wohnung-kaufen",
    );
    expect(buildSearchUrl({ bundesland: "NW", kind: "haus", minArea: 80 })).toBe(
      "https://www.immobilienscout24.de/Suche/de/nordrhein-westfalen/haus-kaufen?livingspace=80.0-",
    );
  });

  it("parses expose ids", () => {
    expect(parseExposeId("123456789")).toBe("123456789");
    expect(parseExposeId("https://www.immobilienscout24.de/expose/148273645#/")).toBe("148273645");
    expect(parseExposeId("https://evil.example/expose/148273645")).toBeNull();
    expect(parseExposeId("javascript:alert(1)")).toBeNull();
    expect(parseExposeId("abc")).toBeNull();
    expect(exposeUrl("123")).toBe("https://www.immobilienscout24.de/expose/123");
  });
});
