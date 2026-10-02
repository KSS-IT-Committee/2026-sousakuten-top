import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
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
  "Geinousai",
  // 校外 (external, non-school) visitor accounts, from
  // 2026-account-generator's external roster. Deliberately NOT in
  // lib/access.ts's INTERNAL_ROLES — these accounts can log in but hold no
  // role any internal page admits.
  "External",
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

export const sousakutenLostItems = pgTable("sousakuten_lost_items", {
  id: serial("id").primaryKey(),
  description: text("description"),
  // SHA-256 of the bytes plus the extension they imply. The photo itself
  // lives on the /app/files mount, not in this table.
  fileName: varchar("file_name", { length: 160 }).notNull(),
  // The committee member who posted it, for the audit trail. Nullable only so
  // it can be ON DELETE SET NULL: removing a staff account must not silently
  // delete the board — and a cascade would strand the photo files too, since
  // deleteLostItem() is the only thing that unlinks them. Same shape and same
  // reasoning as sousakuten_stamps.granted_by.
  uploadedBy: varchar("uploaded_by", { length: 32 }).references(
    () => users.username,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─────────── 公演観覧抽選 — the 創作部門 reception desk ─────────── */

// Who a school seat is for: the account holder themselves (a student, or a
// staff member), or their parents, who apply and watch on the child's account.
export const LOTTERY_APPLICANT_TYPES = ["student", "parent"] as const;
export const lotteryApplicantTypeEnum = pgEnum(
  "lottery_applicant_type",
  LOTTERY_APPLICANT_TYPES,
);

// 公演観覧抽選 当選DB — one row per seat a school account won. Loaded by the
// draw (2026-lottery) and owned by 2026-event-week-top, its only writer (譲渡
// rewrites `username`, 破棄 deletes the row). This app only reads it, for
// /lottery/reception. In `appdata` the unique key is DEFERRABLE (2026-db
// migration 0018), which drizzle-kit cannot express.
export const lotteryResults = pgTable(
  "lottery_results",
  {
    id: serial("id").primaryKey(),
    lotteryId: varchar("lottery_id", { length: 64 }).notNull(),
    slotId: varchar("slot_id", { length: 64 }).notNull(),
    username: varchar("username", { length: 32 })
      .notNull()
      .references(() => users.username, { onDelete: "cascade" }),
    applicantType: lotteryApplicantTypeEnum("applicant_type").notNull(),
    // The act won — for 創作部門, the class code of the play.
    actId: varchar("act_id", { length: 64 }).notNull(),
    // 観覧人数 admitted by this seat.
    partySize: integer("party_size").notNull().default(1),
    choiceRank: integer("choice_rank").notNull(),
    isPriority: boolean("is_priority").notNull().default(false),
    drawnAt: timestamp("drawn_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("lottery_results_slot_applicant_unique").on(
      table.lotteryId,
      table.slotId,
      table.username,
      table.applicantType,
    ),
    index("lottery_results_username_idx").on(table.username),
    index("lottery_results_lottery_slot_idx").on(table.lotteryId, table.slotId),
    check("result_party_size_positive", sql`${table.partySize} >= 1`),
    check("result_choice_rank_range", sql`${table.choiceRank} BETWEEN 1 AND 3`),
  ],
);

// 公演観覧抽選 校外当選DB — the same, for a 校外 applicant, who has no school
// account: the LoGo form's 受付番号 and 抽選番号 stand in for the username.
// Loaded by the draw (out/lottery_external_results.sql); no app writes it.
export const lotteryExternalResults = pgTable(
  "lottery_external_results",
  {
    id: serial("id").primaryKey(),
    lotteryId: varchar("lottery_id", { length: 64 }).notNull(),
    slotId: varchar("slot_id", { length: 64 }).notNull(),
    // 受付番号 — "AE00046805", from the form's confirmation mail.
    receiptNumber: varchar("receipt_number", { length: 32 }).notNull(),
    // 抽選番号 — "0468", what the result letters and /lottery go by.
    lotteryNumber: varchar("lottery_number", { length: 16 }).notNull(),
    actId: varchar("act_id", { length: 64 }).notNull(),
    partySize: integer("party_size").notNull(),
    choiceRank: integer("choice_rank").notNull(),
    drawnAt: timestamp("drawn_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("lottery_external_results_slot_receipt_unique").on(
      table.lotteryId,
      table.slotId,
      table.receiptNumber,
    ),
    index("lottery_external_results_lottery_slot_idx").on(
      table.lotteryId,
      table.slotId,
    ),
    check("external_result_party_size_positive", sql`${table.partySize} >= 1`),
    check(
      "external_result_choice_rank_range",
      sql`${table.choiceRank} BETWEEN 1 AND 3`,
    ),
  ],
);

// 公演観覧抽選 受付DB — a school seat that has been used: its holder came to
// the class's 受付 and was let in. Written by /lottery/reception when the desk
// taps the seat, deleted when it taps it back. No row = not arrived. Keyed to
// the seat, not the account, so a seat handed on by 譲渡 after it was used
// stays used; cascades with the seat, so 破棄 takes it along.
export const lotteryResultCheckins = pgTable("lottery_result_checkins", {
  resultId: integer("result_id")
    .primaryKey()
    .references(() => lotteryResults.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // The desk account that tapped it, for the audit trail. Nullable only so it
  // can be ON DELETE SET NULL, like sousakuten_lost_items.uploaded_by.
  checkedInBy: varchar("checked_in_by", { length: 32 }).references(
    () => users.username,
    { onDelete: "set null" },
  ),
});

// The same record for a 校外 seat.
export const lotteryExternalResultCheckins = pgTable(
  "lottery_external_result_checkins",
  {
    externalResultId: integer("external_result_id")
      .primaryKey()
      .references(() => lotteryExternalResults.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    checkedInBy: varchar("checked_in_by", { length: 32 }).references(
      () => users.username,
      { onDelete: "set null" },
    ),
  },
);
