import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "../db";
import { randomToken, sha256 } from "../crypto";

type TokenType = "password_reset" | "magic_link";

const TTL_MINUTES: Record<TokenType, number> = {
  password_reset: 60,
  magic_link: 15,
};

/** Creates a single-use token, replacing any older token of the same type. */
export async function issueToken(userId: string, type: TokenType): Promise<string> {
  const token = randomToken();
  const db = getDb();
  await db
    .delete(schema.authTokens)
    .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.type, type)));
  await db.insert(schema.authTokens).values({
    id: sha256(token),
    userId,
    type,
    expiresAt: new Date(Date.now() + TTL_MINUTES[type] * 60_000),
  });
  return token;
}

/** Atomically consumes a token. Returns the owning user id or null. */
export async function consumeToken(token: string, type: TokenType): Promise<string | null> {
  const rows = await getDb()
    .delete(schema.authTokens)
    .where(
      and(
        eq(schema.authTokens.id, sha256(token)),
        eq(schema.authTokens.type, type),
        gt(schema.authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: schema.authTokens.userId });
  return rows[0]?.userId ?? null;
}
