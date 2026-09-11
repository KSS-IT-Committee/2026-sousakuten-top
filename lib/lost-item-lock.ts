import "server-only";

import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import type { Executor } from "@/lib/db";

/**
 * A per-file mutex for the 忘れ物 board, so writing a photo and deleting it can
 * never interleave.
 *
 * The hazard it closes: names are the hash of the bytes, so an upload of a
 * photo that is already on the board writes the very same file. Without a lock,
 * a delete can count zero remaining rows, an upload can then commit a row for
 * that same file, and the delete's unlink — which runs after its own snapshot
 * was taken — removes the picture out from under the row that just landed.
 * READ COMMITTED does not prevent that on its own.
 *
 * It is a Postgres advisory lock rather than a lockfile because the database is
 * what every instance genuinely shares: the blue and green containers both hold
 * the same bind mount during a swap, and a lockfile would also have to survive
 * a killed container. `pg_advisory_xact_lock` releases on COMMIT or ROLLBACK,
 * so a request that dies mid-flight cannot wedge the board.
 */

// 32 bits of a digest. A collision would only ever cost two unrelated files a
// little concurrency; it can never make the outcome wrong.
function lockKey(value: string): number {
  return createHash("sha256").update(value).digest().readInt32BE(0);
}

// `appdata` is shared by five apps, so the first half of the key namespaces
// these locks to this board.
const LOCK_NAMESPACE = lockKey("sousakuten_lost_items");

/**
 * Takes the lock for `fileName` until `executor`'s transaction ends. Callers
 * MUST be inside `db.transaction(...)`; outside one the lock would be released
 * immediately and guard nothing.
 */
export async function lockLostItemFile(
  executor: Executor,
  fileName: string,
): Promise<void> {
  await executor.execute(
    sql`select pg_advisory_xact_lock(${LOCK_NAMESPACE}, ${lockKey(fileName)})`,
  );
}
