import { sousakutenStamps, type StampMethod } from "@/db/schema";
import { db } from "@/lib/db";

export type AddStampResult = "collected" | "already-collected";

/**
 * Award one stamp. Callers MUST have checked already that the spot exists and
 * that the granter is allowed to grant it — this function only writes.
 *
 * Re-stamping is the normal case at a busy booth (someone shows their code
 * twice, a staffer scans a queue and loses track), so a duplicate is a no-op
 * that reports itself rather than an error. The distinction matters at the
 * desk: "collected" is worth a reaction, "already-collected" means wave them
 * through.
 */
export async function addStamp(params: {
  username: string;
  spotId: string;
  method: StampMethod;
  /** The staffer, for `scan`. Must be null for `passphrase`. */
  grantedBy: string | null;
}): Promise<AddStampResult> {
  const inserted = await db
    .insert(sousakutenStamps)
    .values({
      username: params.username,
      spotId: params.spotId,
      method: params.method,
      grantedBy: params.grantedBy,
    })
    .onConflictDoNothing({
      target: [sousakutenStamps.username, sousakutenStamps.spotId],
    })
    .returning({ id: sousakutenStamps.id });

  return inserted.length > 0 ? "collected" : "already-collected";
}
