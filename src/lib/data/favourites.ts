import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { decryptJson, encryptJson } from "../crypto";
import { calculate, type CalcInputs, type CalcResults, type Status } from "../calc/engine";

export interface Favourite {
  id: string;
  exposeId: string;
  title: string;
  status: Status;
  inputs: CalcInputs;
  results: CalcResults;
  createdAt: Date;
}

type Row = typeof schema.favourites.$inferSelect;

function decode(row: Row): Favourite {
  const data = decryptJson<{ inputs: CalcInputs; results: CalcResults }>(row.dataEnc);
  return { id: row.id, exposeId: row.exposeId, title: row.title, status: row.status, createdAt: row.createdAt, ...data };
}

export async function listFavourites(userId: string): Promise<Favourite[]> {
  const rows = await getDb()
    .select()
    .from(schema.favourites)
    .where(eq(schema.favourites.userId, userId))
    .orderBy(desc(schema.favourites.createdAt));
  return rows.map(decode);
}

export async function createFavourite(userId: string, exposeId: string, title: string, inputs: CalcInputs) {
  const results = calculate(inputs);
  await getDb()
    .insert(schema.favourites)
    .values({ userId, exposeId, title, status: results.status, dataEnc: encryptJson({ inputs, results }) });
}

export async function deleteFavourite(userId: string, id: string) {
  await getDb()
    .delete(schema.favourites)
    .where(and(eq(schema.favourites.id, id), eq(schema.favourites.userId, userId)));
}
