@AGENTS.md

# Project notes

- Next.js 16 App Router + Server Actions; Drizzle ORM on PostgreSQL. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).
- `src/lib/calc/engine.ts` is pure and shared by client and server. Persisted results are always recomputed server-side (`src/lib/data/*`).
- Sensitive financial data only goes into `*_enc` columns via `encryptJson` — never into plain columns or logs. Use `log` from `src/lib/logger.ts`, never `console.log` with user data.
- Every page/action touching user data must call `requireUser()`/`getCurrentUser()` and scope queries by `userId`. `proxy.ts` is only an optimistic redirect.
- UI strings live in `src/lib/i18n/de.ts` (primary) and `en.ts` (typed against `de`).
- Checks: `npm run lint && npm run typecheck && npm test && npm run build`. Schema changes: edit `src/lib/db/schema.ts`, then `npm run db:generate`.

# UI / design system

- Colours, fonts and component classes (`.card`, `.btn`, `.input`, `.field-affix`, `.table`, `.num` …) live in `src/app/globals.css` as tokens with light and dark values. Use the Tailwind token names (`bg-surface`, `text-ink-2`, `text-muted`, `border-line`, `bg-accent`, `text-good/warn/bad`) — never raw palette colours like `slate-600`.
- Fonts: Schibsted Grotesk (headings, `font-display`), IBM Plex Sans (body, numbers with `tabular-nums` via `.num`), IBM Plex Mono (eyebrows and unit affixes only). Loaded with `next/font`, so they are self-hosted.
- Charts (`src/components/charts.tsx`, `MiniGauge.tsx`): series colours are the validated blue/orange pair `--series-1` / `--series-2` (passes CVD checks in both modes). Status colours (`--good/warn/bad-mark`) are reserved for feasibility state and always appear with an icon + label (`StatusPill`). Chart text uses ink tokens, never series colours; bars ≤ 24px with 4px rounded data-ends; lines 2px.
