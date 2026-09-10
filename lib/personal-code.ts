import "server-only";

import { createHmac } from "node:crypto";

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
