import "server-only";

import { hasAnyRole, type Role } from "@/lib/access";
import type { SessionUser } from "@/lib/session";

/**
 * The 創作部門 classes themselves: the 5・6年 students, whose classes are the
 * acts. Each of them records on their own class's list and no other
 * (canRecordArrivals).
 */
const RECEPTION_CLASS_ROLES: readonly Role[] = ["G5", "G6"];

/**
 * The committees running the 創作展 — IT委員会, and 創作展委員会 including its
 * 幹部: they record on EVERY class's list, so a desk that cannot record for
 * itself — nobody logged in, a forgotten password, a phone that died — can be
 * worked from a committee account. These are hand-granted (SQL) to accounts
 * in any year, so they are not tied to a grade role.
 */
const RECEPTION_COMMITTEE_ROLES: readonly Role[] = [
  "IT",
  "Sousakuten",
  "SousakutenMain",
];

/**
 * Who may open /lottery/reception at all: the 創作部門 classes and the
 * committees above. The page lists every winner of every performance, so it
 * is deliberately narrower than INTERNAL_ROLES — and seeing a list is not the
 * same as recording on it (canRecordArrivals).
 */
export const RECEPTION_ROLES: readonly Role[] = [
  ...RECEPTION_CLASS_ROLES,
  ...RECEPTION_COMMITTEE_ROLES,
];

// Population roles → the parts of a class code, as 2026-account-generator
// grants them (a student gets exactly one G<grade> and one Class<letter>).
// Keyed by plain strings: SessionUser.roles is string[].
const GRADE_BY_ROLE = new Map([
  ["G1", "1"],
  ["G2", "2"],
  ["G3", "3"],
  ["G4", "4"],
  ["G5", "5"],
  ["G6", "6"],
]);
const LETTER_BY_ROLE = new Map([
  ["ClassA", "A"],
  ["ClassB", "B"],
  ["ClassC", "C"],
  ["ClassD", "D"],
]);

/**
 * The class an account's roles pin it to ("G6" + "ClassA" -> "6A"), or null
 * when they do not name exactly one: staff and committee-only accounts, and
 * contradictory roles, which get no class rather than several.
 */
export function classFromRoles(roles: readonly string[]): string | null {
  const grades = roles.flatMap((role) => GRADE_BY_ROLE.get(role) ?? []);
  const letters = roles.flatMap((role) => LETTER_BY_ROLE.get(role) ?? []);
  if (grades.length !== 1 || letters.length !== 1) return null;
  return `${grades[0]}${letters[0]}`;
}

/**
 * Whether `user` may record arrivals for the performances of class `actId`:
 * that class's own members, whose 受付 it is, and the IT・創作展 committees,
 * for every class. Decided from roles, never from the username, like every
 * other authorization in these apps.
 */
export function canRecordArrivals(user: SessionUser, actId: string): boolean {
  if (hasAnyRole(user, RECEPTION_COMMITTEE_ROLES)) return true;
  return (
    hasAnyRole(user, RECEPTION_CLASS_ROLES) &&
    classFromRoles(user.roles) === actId
  );
}
