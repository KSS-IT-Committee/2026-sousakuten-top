import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// Local copy of the tables this app queries. The canonical schema (and the
// only thing that migrates the shared `appdata` database) is 2026-db —
// mirror any change there and keep it additive.

export const ROLENAMES = [
  // Committee roles — granted by hand (SQL UPDATE) to individual accounts.
  "IT",
  "Sousakuten",
  "Taiikusai",
  // Population roles — every roster account carries them via
  // 2026-account-generator's users.sql: students get G<grade> + Class<letter>
  // + Students, staff accounts get Teachers. AuthGuard/Internal gate on these
  // instead of username patterns. Append-only: Postgres enums cannot drop or
  // reorder values, so new roles go at the end.
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "ClassA",
  "ClassB",
  "ClassC",
  "ClassD",
  "Students",
  "Teachers",
  "SousakutenMain",
] as const;
export const roleEnum = pgEnum("role", ROLENAMES);

// Login credentials, loaded out-of-band from 2026-account-generator's
// users.sql. event-week-top hosts the /login page; this app only reads the
// table through `sessions`.
export const users = pgTable("users", {
  username: varchar("username", { length: 32 }).primaryKey(),
  passwordHash: varchar("password_hash", { length: 60 }).notNull(),
  // Latches true on the account's first successful login and never goes back
  // to false. Lets us tell which accounts have ever been used.
  hasLoggedIn: boolean("has_logged_in").notNull().default(false),
  roles: roleEnum("roles")
    .array()
    .notNull()
    .default(sql`'{}'`),
});

// Login sessions, shared by every *.2026 app. The browser cookie holds a
// random token; `id` is the SHA-256 hex of that token, so a leaked table
// dump cannot be replayed as a cookie. Expiry slides on access: apps renew
// `expires_at` to now + TTL (default 2 days) when they validate a session.
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    username: varchar("username", { length: 32 })
      .notNull()
      .references(() => users.username, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sessions_username_idx").on(table.username),
    index("sessions_expires_at_idx").on(table.expiresAt),
    // Belt-and-braces: `id` must be a lowercase SHA-256 hex digest (what the
    // apps store). Rejects a raw token accidentally inserted as the id, which
    // would otherwise be a replayable cookie value.
    check("session_id_is_sha256_hex", sql`${table.id} ~ '^[0-9a-f]{64}$'`),
  ],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

/* ──────────── 創作展スタンプラリー ──────────── */

// Mirrors 2026-db. Spot ids are app-side config (lib/stamps.ts), never rows.
export const STAMP_METHODS = ["scan", "passphrase"] as const;

export const stampMethodEnum = pgEnum("stamp_method", STAMP_METHODS);

export type StampMethod = (typeof STAMP_METHODS)[number];

export const sousakutenStamps = pgTable(
  "sousakuten_stamps",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 32 })
      .notNull()
      .references(() => users.username, { onDelete: "cascade" }),
    spotId: varchar("spot_id", { length: 64 }).notNull(),
    method: stampMethodEnum("method").notNull(),
    // NULL for a `passphrase` row, and also for a `scan` row whose granting
    // account has since been deleted (ON DELETE SET NULL).
    grantedBy: varchar("granted_by", { length: 32 }).references(
      () => users.username,
      { onDelete: "set null" },
    ),
    collectedAt: timestamp("collected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("sousakuten_stamps_username_spot_unique").on(
      table.username,
      table.spotId,
    ),
    index("sousakuten_stamps_username_idx").on(table.username),
    index("sousakuten_stamps_spot_idx").on(table.spotId),
    check(
      "sousakuten_stamps_not_self_granted",
      sql`${table.grantedBy} IS NULL OR ${table.grantedBy} <> ${table.username}`,
    ),
    check(
      "sousakuten_stamps_passphrase_has_no_granter",
      sql`${table.method} <> 'passphrase' OR ${table.grantedBy} IS NULL`,
    ),
  ],
);

export const sousakutenStampPassphrases = pgTable(
  "sousakuten_stamp_passphrases",
  {
    spotId: varchar("spot_id", { length: 64 }).primaryKey(),
    passphrase: varchar("passphrase", { length: 64 }).notNull(),
    updatedBy: varchar("updated_by", { length: 32 }).references(
      () => users.username,
      { onDelete: "set null" },
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export type SousakutenStamp = typeof sousakutenStamps.$inferSelect;
export type SousakutenStampPassphrase =
  typeof sousakutenStampPassphrases.$inferSelect;
