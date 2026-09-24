import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "./db";
import { sha256 } from "./crypto";

// Fixed-window rate limiter stored in Postgres so it works across multiple
// app instances. Identifiers (IPs, e-mails) are hashed before storage.

export const LIMITS = {
  login: { max: 10, windowSec: 15 * 60 },
  register: { max: 5, windowSec: 60 * 60 },
  passwordReset: { max: 5, windowSec: 60 * 60 },
  magicLink: { max: 5, windowSec: 60 * 60 },
  tokenRedeem: { max: 20, windowSec: 15 * 60 },
  export: { max: 10, windowSec: 60 * 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

/** Returns true if the call is allowed, false if the limit is exceeded. */
export async function hit(limit: LimitName, identifier: string): Promise<boolean> {
  const { max, windowSec } = LIMITS[limit];
  const key = sha256(`${limit}:${identifier}`);
  const result = await getDb().execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                   THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec})
                   THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `);
  // Opportunistic cleanup of stale windows (~1% of calls).
  if (Math.random() < 0.01) {
    await getDb().execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
  }
  return Number(result.rows[0].count) <= max;
}

/**
 * Client IP as reported by the hosting proxy. Only trust X-Forwarded-For when
 * the app runs behind a proxy that sets it (Vercel, Railway, Fly, nginx).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Checks both the IP and (optionally) the targeted e-mail bucket. */
export async function allow(limit: LimitName, email?: string): Promise<boolean> {
  const ipOk = await hit(limit, `ip:${await clientIp()}`);
  const emailOk = email ? await hit(limit, `email:${email.toLowerCase()}`) : true;
  return ipOk && emailOk;
}
