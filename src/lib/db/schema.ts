import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Sensitive financial values live only in the *_enc columns (AES-256-GCM, see
// src/lib/crypto.ts). Everything else is non-sensitive preference/metadata.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // always stored lower-cased
  passwordHash: text("password_hash").notNull(),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
  privacyVersion: text("privacy_version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 of the cookie token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: text("id").primaryKey(), // sha256 of the emailed token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["password_reset", "magic_link"] }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // { equity, netIncome } — only present while financial consent is given.
  financialEnc: text("financial_enc"),
  financialConsentAt: timestamp("financial_consent_at", { withTimezone: true }),
  preferredStates: text("preferred_states").array().notNull().default([]),
  preferredCities: text("preferred_cities").array().notNull().default([]),
  riskTolerance: text("risk_tolerance", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  defaultGoal: text("default_goal", {
    enum: ["interest_coverage", "cashflow_positive", "equity_buildup"],
  })
    .notNull()
    .default("cashflow_positive"),
  interestRatePct: doublePrecision("interest_rate_pct").notNull().default(3.8),
  repaymentRatePct: doublePrecision("repayment_rate_pct").notNull().default(2),
  fixedRateYears: integer("fixed_rate_years").notNull().default(10),
  vacancyBufferPct: doublePrecision("vacancy_buffer_pct").notNull().default(3),
  maintenancePerSqmYear: doublePrecision("maintenance_per_sqm_year").notNull().default(12),
  brokerPct: doublePrecision("broker_pct").notNull().default(3.57),
  language: text("language", { enum: ["de", "en"] }).notNull().default("de"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", { enum: ["green", "yellow", "red"] }).notNull(),
    // { inputs: CalcInputs, results: CalcResults }
    dataEnc: text("data_enc").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scenarios_user_idx").on(t.userId)],
);

export const favourites = pgTable(
  "favourites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exposeId: text("expose_id").notNull(),
    title: text("title").notNull(),
    status: text("status", { enum: ["green", "yellow", "red"] }).notNull(),
    // { inputs: CalcInputs, results: CalcResults, notes }
    dataEnc: text("data_enc").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("favourites_user_idx").on(t.userId)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(), // sha256(bucket:identifier)
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});
