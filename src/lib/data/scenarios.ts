import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../db";
import { decryptJson, encryptJson } from "../crypto";
import { calculate, type CalcInputs, type CalcResults, type Status } from "../calc/engine";

export interface Scenario {
  id: string;
  name: string;
  status: Status;
  inputs: CalcInputs;
  results: CalcResults;
  createdAt: Date;
  updatedAt: Date;
}

type Row = typeof schema.scenarios.$inferSelect;

function decode(row: Row): Scenario {
  const data = decryptJson<{ inputs: CalcInputs; results: CalcResults }>(row.dataEnc);
  return { id: row.id, name: row.name, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt, ...data };
}

/** Results are always recomputed on the server — client-side results are never trusted. */
function encode(inputs: CalcInputs) {
  const results = calculate(inputs);
  return { status: results.status, dataEnc: encryptJson({ inputs, results }) };
}

export async function listScenarios(userId: string, limit?: number): Promise<Scenario[]> {
  const q = getDb()
    .select()
    .from(schema.scenarios)
    .where(eq(schema.scenarios.userId, userId))
    .orderBy(desc(schema.scenarios.updatedAt));
  const rows = limit ? await q.limit(limit) : await q;
  return rows.map(decode);
}

export async function getScenario(userId: string, id: string): Promise<Scenario | null> {
  const rows = await getDb()
    .select()
    .from(schema.scenarios)
    .where(and(eq(schema.scenarios.id, id), eq(schema.scenarios.userId, userId)))
    .limit(1);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getScenarios(userId: string, ids: string[]): Promise<Scenario[]> {
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(schema.scenarios)
    .where(and(inArray(schema.scenarios.id, ids), eq(schema.scenarios.userId, userId)));
  const byId = new Map(rows.map((r) => [r.id, decode(r)]));
  return ids.map((id) => byId.get(id)).filter((s): s is Scenario => Boolean(s));
}

export async function createScenario(userId: string, name: string, inputs: CalcInputs) {
  const rows = await getDb()
    .insert(schema.scenarios)
    .values({ userId, name, ...encode(inputs) })
    .returning({ id: schema.scenarios.id });
  return rows[0].id;
}

export async function updateScenario(userId: string, id: string, name: string, inputs: CalcInputs) {
  const rows = await getDb()
    .update(schema.scenarios)
    .set({ name, ...encode(inputs), updatedAt: new Date() })
    .where(and(eq(schema.scenarios.id, id), eq(schema.scenarios.userId, userId)))
    .returning({ id: schema.scenarios.id });
  return rows[0]?.id ?? null;
}

export async function deleteScenario(userId: string, id: string) {
  await getDb()
    .delete(schema.scenarios)
    .where(and(eq(schema.scenarios.id, id), eq(schema.scenarios.userId, userId)));
}
