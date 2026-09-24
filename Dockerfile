# Multi-stage build producing a small standalone Next.js server image.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN useradd --system --uid 1001 app
COPY --from=build --chown=app /app/.next/standalone ./
COPY --from=build --chown=app /app/.next/static ./.next/static
# Migration runner (npm run db:migrate equivalent) for release/deploy hooks.
COPY --from=build --chown=app /app/drizzle ./drizzle
COPY --from=build --chown=app /app/scripts ./scripts
COPY --from=deps --chown=app /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=app /app/node_modules/pg ./node_modules/pg
USER app
EXPOSE 3000
CMD ["node", "server.js"]
