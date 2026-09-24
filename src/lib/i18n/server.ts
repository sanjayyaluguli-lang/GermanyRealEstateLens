import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../auth/session";
import { getDb, schema } from "../db";
import { getDictionary, isLang, LANG_COOKIE, type Lang } from ".";

/** Language: the logged-in user's profile setting, else the cookie, else German. */
export const getLang = cache(async (): Promise<Lang> => {
  const user = await getCurrentUser();
  if (user) {
    const row = await getDb()
      .select({ language: schema.profiles.language })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);
    if (row[0]) return row[0].language;
  }
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : "de";
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: getDictionary(lang) };
}
