import { eq } from "drizzle-orm";

import { sousakutenStamps } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Spot ids this account has collected. Returned as a Set because the only
 * question the card asks of it is membership, 47 times.
 *
 * Ids no longer in lib/stamps.ts (a retired exhibit) come back too and are
 * simply not rendered — the row stays in the database as history rather than
 * being cleaned up behind the holder's back.
 */
export async function getCollectedSpotIds(
  username: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ spotId: sousakutenStamps.spotId })
    .from(sousakutenStamps)
    .where(eq(sousakutenStamps.username, username));

  return new Set(rows.map((row) => row.spotId));
}
