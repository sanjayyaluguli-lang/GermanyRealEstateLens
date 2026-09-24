@AGENTS.md

# Project notes

- Next.js 16 App Router + Server Actions; Drizzle ORM on PostgreSQL. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).
- `src/lib/calc/engine.ts` is pure and shared by client and server. Persisted results are always recomputed server-side (`src/lib/data/*`).
- Sensitive financial data only goes into `*_enc` columns via `encryptJson` — never into plain columns or logs. Use `log` from `src/lib/logger.ts`, never `console.log` with user data.
- Every page/action touching user data must call `requireUser()`/`getCurrentUser()` and scope queries by `userId`. `proxy.ts` is only an optimistic redirect.
- UI strings live in `src/lib/i18n/de.ts` (primary) and `en.ts` (typed against `de`).
- Checks: `npm run lint && npm run typecheck && npm test && npm run build`. Schema changes: edit `src/lib/db/schema.ts`, then `npm run db:generate`.
