import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The string one account's personal QR code carries.
 *
 * It is deliberately NOT the bare username. Usernames are a public,
 * enumerable grid (`1A01` … `6D40`), so a code that was just the username
 * could be forged for anyone by typing four characters into any QR
 * generator — which matters the moment the code is used to admit someone to
 * a 公演 they hold a lottery seat for, or to stamp a rally card.
 *
 * Format, both variants dot-separated so a reader can split on "." and branch
 * on the first field:
 *
 *   s1.<username>.<signature>   signed   — signature is the first
 *                                          SIGNATURE_HEX_LENGTH hex characters
 *                                          of HMAC-SHA256("s1.<username>")
 *                                          keyed with PERSONAL_CODE_SECRET
 *   u1.<username>               unsigned — PERSONAL_CODE_SECRET is not set
 *
 * The unsigned form exists so local dev, `vvps` and PR previews keep working
 * without the secret; it is named rather than silently substituted precisely
 * so a future scanner can refuse "u1" outright instead of trusting a code that
 * merely looks fine. Set PERSONAL_CODE_SECRET in production (ansible's
 * per-app `app_secrets`, NOT a NEXT_PUBLIC_ var — the value must never reach
 * the browser) before anything acts on a scan.
 *
 * The signature is truncated to 64 bits. That is short for a MAC in general,
 * but it is checked against a value the verifier recomputes from a username it
 * already has, so forging one means finding a preimage online, against a
 * staffed door, within a two-day festival — not an offline search.
 */

const SIGNED_PREFIX = "s1";
const UNSIGNED_PREFIX = "u1";

/** Hex characters of HMAC kept — 16 hex chars = 64 bits. */
const SIGNATURE_HEX_LENGTH = 16;

export function personalCodeFor(username: string): string {
  const secret = process.env.PERSONAL_CODE_SECRET;
  if (!secret) {
    return `${UNSIGNED_PREFIX}.${username}`;
  }

  const body = `${SIGNED_PREFIX}.${username}`;
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("hex")
    .slice(0, SIGNATURE_HEX_LENGTH);

  return `${body}.${signature}`;
}

/** What a scanned code turned out to be. */
export type PersonalCode = {
  readonly username: string;
  /** False only in the unsigned fallback, which is refused once a secret exists. */
  readonly isSigned: boolean;
};

/**
 * The reader half of personalCodeFor: turns a scanned string back into the
 * account it names, or null if it names none.
 *
 * The policy is deliberately keyed off whether PERSONAL_CODE_SECRET is
 * configured, not off what the code claims:
 *
 *   - secret set     -> only "s1" codes with a matching signature pass, and
 *                       "u1" is refused outright. Wiring the secret is
 *                       therefore a pure upgrade with no second switch to
 *                       remember to flip.
 *   - secret not set -> only "u1" passes, since there is nothing to verify a
 *                       signature against and accepting one unchecked would
 *                       be worse than accepting none.
 *
 * Returning null covers every failure — wrong shape, wrong prefix, bad
 * signature, unknown format version — because a scanner has exactly one useful
 * thing to say either way ("読み取れませんでした"), and distinguishing them out
 * loud would tell an attacker which half of a forgery was wrong.
 */
export function readPersonalCode(raw: string): PersonalCode | null {
  const parts = raw.trim().split(".");
  const secret = process.env.PERSONAL_CODE_SECRET;

  if (!secret) {
    if (parts.length !== 2 || parts[0] !== UNSIGNED_PREFIX) return null;
    return isPlausibleUsername(parts[1])
      ? { username: parts[1], isSigned: false }
      : null;
  }

  if (parts.length !== 3 || parts[0] !== SIGNED_PREFIX) return null;
  const [, username, signature] = parts;
  if (!isPlausibleUsername(username)) return null;

  const expected = createHmac("sha256", secret)
    .update(`${SIGNED_PREFIX}.${username}`)
    .digest("hex")
    .slice(0, SIGNATURE_HEX_LENGTH);

  // timingSafeEqual throws on a length mismatch, so screen that first.
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  return { username, isSigned: true };
}

/**
 * A cheap shape check before the username reaches a query. It is NOT an
 * existence check — the caller still has to look the account up — it only
 * keeps junk out of `users.username`, which is varchar(32).
 */
function isPlausibleUsername(value: string): boolean {
  return /^[A-Za-z0-9]{1,32}$/.test(value);
}
