# GermanyRealEstateLens

A research assistant for buy-to-let property in Germany. It calculates how much a property can cost, what rent it needs, and its cash flow and loan-to-value (LTV). With an account it also remembers your financial situation, preferences and past analyses.

German is the primary language and English is optional.

## Features

| MVP step | Feature | Where |
|---|---|---|
| 1 | **Calculator without login**: max purchase price, required rent, cash flow before/after repayment, LTV, yields, price-to-rent factor, residual debt after the fixed-rate period, 30-year projection, green/yellow/red feasibility | `/calculator`, `src/lib/calc/engine.ts` |
| 2 | **Accounts**: e-mail + password (Argon2id), optional magic-link login, password reset, DB-backed sessions in `httpOnly` `__Host-` cookies | `src/app/actions/auth.ts`, `src/lib/auth/*` |
| 3 | **Profile**: Eigenkapital, net income (both encrypted, stored only with explicit consent), preferred Bundesländer/cities, risk tolerance, default goal, Tilgung, interest, vacancy buffer, maintenance, broker fee, language. It pre-fills every new calculation | `/profile` |
| 4 | **Saved scenarios**: name them, reload, overwrite, compare 2–4 side by side, delete. Inputs and results are stored; results are always recomputed on the server | `/scenarios`, `/scenarios/compare` |
| 5 | **Dashboard**: profile overview, scenarios with status dots, "New calculation", and Immobilienscout24 search links for your regions capped at your latest feasible max price | `/dashboard`, `src/lib/is24.ts` |
| + | **Favourites**: store IS24 expose links/IDs with price, rent and area; metrics are calculated from your profile | `/favourites` |
| + | **GDPR**: data export as JSON (Art. 15/20), immediate full account deletion, consent withdrawal wipes financial data, privacy policy template | `/account`, `/privacy` |

### Goals

- **Interest coverage (Zinsdeckung)**: rent after the vacancy buffer covers operating costs plus interest.
- **Cash-flow positive**: rent covers operating costs plus the full annuity (interest + Tilgung).
- **Equity build-up (Vermögensaufbau)**: a monthly top-up from salary is allowed: 5 / 10 / 20 % of net income for low / medium / high risk tolerance.

The max purchase price solves the goal inequality exactly for the price, including side costs. Required rent solves it for the rent.

**Not modelled:** income tax and depreciation (AfA), and follow-up interest rates after the Zinsbindung. The current rate is assumed to continue, and residual debt is shown as a risk.

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`), React 19, Tailwind CSS 4
- **PostgreSQL** with **Drizzle ORM** (SQL migrations in `drizzle/`)
- Custom auth (no third-party identity provider, so no data leaves the EU): `@node-rs/argon2`, SHA-256-hashed session and e-mail tokens
- Zod validation, Vitest unit tests

## Security & privacy

- **Encryption at rest**: Eigenkapital/income, scenarios and favourites are stored in AES-256-GCM encrypted columns (`src/lib/crypto.ts`). The database alone reveals no amounts.
- **No sensitive logging**: `src/lib/logger.ts` logs event names and IDs only and redacts money, e-mail, token or password keys. Request bodies are never logged.
- **Rate limiting**: Postgres-backed fixed windows per IP and per e-mail for login, registration, reset, magic link, token redemption and export (`src/lib/rate-limit.ts`).
- **HTTPS only**: `proxy.ts` sends a 308 redirect to `APP_URL` for plain-HTTP requests in production. HSTS with preload, a CSP, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer` (tokens in reset links never leak) and `nosniff` are set in `next.config.ts`.
- **Sessions**: 256-bit random tokens. Only their SHA-256 hash is stored. Cookies are `httpOnly`, `Secure`, `SameSite=Lax` with the `__Host-` prefix, and expire after 30 days. A password change or reset revokes all sessions.
- **No account enumeration**: reset and magic-link requests always give the same answer, and login runs a dummy hash for unknown e-mails.
- **Magic links** open a confirmation page that POSTs, so mail-scanner GETs cannot use up the one-time token.
- **Consent**: accepting the privacy policy is stored with its version. Financial data needs a separate opt-in, and withdrawing it deletes that data immediately.

## Getting started

```bash
cp .env.example .env              # set ENCRYPTION_KEY: openssl rand -base64 32
docker compose up -d              # local Postgres (or point DATABASE_URL elsewhere)
npm install
npm run db:migrate
npm run dev                       # http://localhost:3000
```

Without `SMTP_URL`, development prints reset and magic-link e-mails to the server console.

| Script | |
|---|---|
| `npm test` | unit tests (calculator, crypto, IS24 links, log redaction) |
| `npm run typecheck` / `npm run lint` | static checks |
| `npm run db:generate` | create a migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | apply migrations |

## Deploying in the EU

All personal data should stay in the EU:

| Piece | EU options |
|---|---|
| App | Vercel with the function region pinned to `fra1`, Railway (EU West), Fly.io (`fra`), Scaleway, Hetzner. A `Dockerfile` (Next.js standalone) is included |
| Database | Neon (`aws-eu-central-1`), Supabase (Frankfurt), Railway EU, Scaleway Managed PostgreSQL |
| E-mail | Brevo, Mailjet, Scaleway TEM (set `SMTP_URL`) |

Checklist:
1. Set `DATABASE_URL`, `ENCRYPTION_KEY`, `APP_URL` (https), `SMTP_URL`, `MAIL_FROM` and `NEXT_PUBLIC_OPERATOR_CONTACT`.
2. Run migrations on each release (`npm run db:migrate`, or `node scripts/migrate.mjs` in the Docker image).
3. Run behind a TLS-terminating proxy that sets `X-Forwarded-Proto` and `X-Forwarded-For`. Rate limiting depends on the client IP.
4. Back up `ENCRYPTION_KEY` securely. Without it, the encrypted data is unrecoverable.
5. Complete and legally review the privacy policy template (`src/app/privacy/page.tsx`). Sign data processing agreements (AVV) with your hosting, database and e-mail providers.

## Roadmap ideas

- Google / Apple sign-in (e.g. Auth.js with the same `users` table)
- Tax module (AfA, marginal tax rate) and follow-up-rate stress test
- E-mail verification on sign-up; key rotation for `ENCRYPTION_KEY` (ciphertexts are already versioned `v1.`)
- Charts for the 30-year projection
