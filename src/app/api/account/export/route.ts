import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { listFavourites } from "@/lib/data/favourites";
import { getProfile } from "@/lib/data/profile";
import { listScenarios } from "@/lib/data/scenarios";
import { log } from "@/lib/logger";
import { allow } from "@/lib/rate-limit";

// GDPR Art. 15 / 20: complete export of everything stored about the user.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await allow("export", user.id))) return new Response("Too many requests", { status: 429 });

  const [account] = await getDb()
    .select({
      email: schema.users.email,
      createdAt: schema.users.createdAt,
      privacyAcceptedAt: schema.users.privacyAcceptedAt,
      privacyVersion: schema.users.privacyVersion,
    })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));
  const sessions = await getDb()
    .select({ createdAt: schema.sessions.createdAt, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, user.id));

  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, ...account },
    profile: await getProfile(user.id),
    scenarios: await listScenarios(user.id),
    favourites: await listFavourites(user.id),
    activeSessions: sessions,
  };
  log.info("account.exported", { userId: user.id });
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="germanyrealestatelens-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
