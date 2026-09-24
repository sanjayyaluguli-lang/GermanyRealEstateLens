import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptJson, encryptJson, sha256 } from "./crypto";
import { _redactForTests } from "./logger";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("crypto", () => {
  it("round-trips JSON and never contains plaintext", () => {
    const value = { equity: 123456, netIncome: 4321 };
    const enc = encryptJson(value);
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain("123456");
    expect(decryptJson(enc)).toEqual(value);
  });

  it("uses a fresh IV per encryption", () => {
    expect(encryptJson({ a: 1 })).not.toBe(encryptJson({ a: 1 }));
  });

  it("detects tampering", () => {
    const enc = encryptJson({ equity: 1 });
    const parts = enc.split(".");
    const data = Buffer.from(parts[3], "base64url");
    data[0] ^= 1;
    parts[3] = data.toString("base64url");
    expect(() => decryptJson(parts.join("."))).toThrow();
  });

  it("hashes deterministically", () => {
    expect(sha256("x")).toHaveLength(64);
    expect(sha256("x")).toBe(sha256("x"));
  });

  it("logger redacts sensitive keys", () => {
    expect(_redactForTests({ userId: "u1", equity: 5, netIncome: 3, email: "a@b" })).toEqual({
      userId: "u1",
      equity: "[redacted]",
      netIncome: "[redacted]",
      email: "[redacted]",
    });
  });
});
