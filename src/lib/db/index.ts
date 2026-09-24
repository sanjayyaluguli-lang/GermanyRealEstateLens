import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

// Created lazily (so `next build` works without a database) and reused across
// hot reloads in development.
const globalForDb = globalThis as unknown as { grlDb?: Db; grlPool?: Pool };

export function getDb(): Db {
  if (!globalForDb.grlDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalForDb.grlPool = new Pool({ connectionString, max: 10 });
    globalForDb.grlDb = drizzle(globalForDb.grlPool, { schema });
  }
  return globalForDb.grlDb;
}

export async function closeDb() {
  await globalForDb.grlPool?.end();
  globalForDb.grlDb = undefined;
  globalForDb.grlPool = undefined;
}

export { schema };
