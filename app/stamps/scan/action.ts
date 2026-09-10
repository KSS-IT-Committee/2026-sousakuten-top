"use server";

import { addStamp } from "@/db/addStamp";
import { userExists } from "@/db/getUserByUsername";
import { readPersonalCode } from "@/lib/personal-code";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { canGrantStamp, type StampSpot, stampSpotById } from "@/lib/stamps";

export type GrantResult =
  | { status: "collected"; username: string; spotName: string }
  | { status: "already"; username: string }
  | { status: "unreadable" }
  | { status: "unknown-user" }
  | { status: "self" }
  | { status: "forbidden" }
  | { status: "signed-out" }
  | { status: "rate-limited"; retryAfterSeconds: number };

/** Generous: a busy desk scans fast, this only catches a runaway loop. */
const GRANT_LIMIT = 240;
const GRANT_WINDOW_MS = 5 * 60 * 1000;

/**
 * Grant one stamp from a scanned personal QR.
 *
 * Called straight from the scanner rather than through a <form>, so treat it
 * as the public endpoint it is: the granter's session and their permission for
 * THIS spot are both re-derived here. The client sends a spot id, never a
 * decision.
 */
export async function grantStampAction(
  spotId: string,
  code: string,
): Promise<GrantResult> {
  const authorised = await authorise(spotId);
  if ("status" in authorised) return authorised;

  const scanned = readPersonalCode(code);
  if (!scanned) return { status: "unreadable" };

  return grant(authorised.granter, authorised.spot, scanned.username);
}

/**
 * Grant one stamp to a username the staffer typed in, for when the camera
 * will not cooperate — no permission, a cracked lens, a screen too dim to
 * read.
 *
 * Deliberately its own action rather than the scanner handing
 * grantStampAction a synthesised code. Those are different claims: a scan
 * says "this device read a code the server issued", typing says "the person
 * at this desk vouches that this is who they say". Dressing the second up as
 * the first would also break the moment PERSONAL_CODE_SECRET is set, since
 * readPersonalCode then refuses unsigned codes by design.
 *
 * That means a staffer can hand a stamp to any account without seeing a code
 * at all. For a rally that is the right trade — they can only do it for their
 * own booth, every row records who they are, and the alternative is a desk
 * that stops working when a phone camera does.
 */
export async function grantStampByUsernameAction(
  spotId: string,
  username: string,
): Promise<GrantResult> {
  const authorised = await authorise(spotId);
  if ("status" in authorised) return authorised;

  const trimmed = username.trim();
  if (!/^[A-Za-z0-9]{1,32}$/.test(trimmed)) return { status: "unknown-user" };

  return grant(authorised.granter, authorised.spot, trimmed);
}

type Authorised = { granter: SessionUser; spot: StampSpot };

/** Session + per-spot permission + rate limit, shared by both entry points. */
async function authorise(spotId: string): Promise<Authorised | GrantResult> {
  const granter = await getCurrentUser();
  if (!granter) return { status: "signed-out" };

  const spot = stampSpotById(spotId);
  // An unknown spot and a spot this account may not stamp are reported the
  // same way: neither is something the operator can act on, and separating
  // them only tells a prodding client which spot ids are real.
  if (!spot || !canGrantStamp(granter.roles, spot)) {
    return { status: "forbidden" };
  }

  const limit = checkRateLimit(
    `stamp-grant:${granter.username}`,
    GRANT_LIMIT,
    GRANT_WINDOW_MS,
  );
  if (!limit.ok) {
    return {
      status: "rate-limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  return { granter, spot };
}

async function grant(
  granter: SessionUser,
  spot: StampSpot,
  username: string,
): Promise<GrantResult> {
  // The DB rejects this too; catching it here makes it a sentence at the desk
  // rather than a constraint violation.
  if (username === granter.username) return { status: "self" };

  if (!(await userExists(username))) return { status: "unknown-user" };

  const result = await addStamp({
    username,
    spotId: spot.id,
    method: "scan",
    grantedBy: granter.username,
  });

  return result === "collected"
    ? { status: "collected", username, spotName: spot.name }
    : { status: "already", username };
}
