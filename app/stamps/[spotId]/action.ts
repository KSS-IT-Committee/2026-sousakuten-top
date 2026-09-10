"use server";

import { timingSafeEqual } from "node:crypto";

import { addStamp } from "@/db/addStamp";
import { getStampPassphrase } from "@/db/getStampPassphrases";
import { normalizePassphrase } from "@/lib/passphrase";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { stampSpotById } from "@/lib/stamps";

export type ClaimState =
  | { status: "idle" }
  | { status: "collected"; spotName: string }
  | { status: "already" }
  | { status: "wrong" }
  | { status: "rate-limited"; retryAfterSeconds: number }
  | { status: "unavailable" }
  | { status: "signed-out" };

/** Ten tries per account per five minutes, across every booth. */
const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

/**
 * Claim a stamp by typing the passphrase printed at the booth.
 *
 * A server action is a public endpoint, so nothing the form sends is trusted:
 * the session is re-read here, the spot id is resolved against the catalogue
 * rather than used as given, and the passphrase is fetched from the database
 * rather than compared to anything the client supplied.
 *
 * The limiter is what makes a 6-character passphrase enough. 32^6 is about a
 * billion, but only ten guesses per account per five minutes ever reach the
 * comparison, and every one of them is attributable to a named account — this
 * is not a lock, it is a tripwire on a poster that everyone at the booth can
 * already read.
 */
export async function claimStampAction(
  _previous: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const user = await getCurrentUser();
  if (!user) return { status: "signed-out" };

  const spotId = formData.get("spotId");
  const spot = typeof spotId === "string" ? stampSpotById(spotId) : null;
  if (!spot) return { status: "unavailable" };

  const limit = checkRateLimit(
    `stamp-passphrase:${user.username}`,
    ATTEMPT_LIMIT,
    ATTEMPT_WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      status: "rate-limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  const expected = await getStampPassphrase(spot.id);
  // No passphrase generated for this booth: there is nothing to be right
  // about, so say so rather than reporting every attempt as wrong.
  if (expected === null) return { status: "unavailable" };

  const submitted = normalizePassphrase(
    String(formData.get("passphrase") ?? ""),
  );
  if (!isEqual(submitted, normalizePassphrase(expected))) {
    return { status: "wrong" };
  }

  const result = await addStamp({
    username: user.username,
    spotId: spot.id,
    method: "passphrase",
    grantedBy: null,
  });

  return result === "collected"
    ? { status: "collected", spotName: spot.name }
    : { status: "already" };
}

/**
 * Constant-time compare. The passphrase is printed on a wall, so this is not
 * guarding much — but the comparison is cheap and a naive `===` on a secret
 * pulled from the database is the kind of thing that gets copied into
 * somewhere it does matter.
 */
function isEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
