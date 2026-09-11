import { eq } from "drizzle-orm";

import { sousakutenLostItems } from "@/db/schema";
import { db } from "@/lib/db";
import { lockLostItemFile } from "@/lib/lost-item-lock";

import { discardUnreferencedImage } from "./discardUnreferencedImage";

/**
 * Removes the row, and the photo too once no row is left using it.
 *
 * The row goes in its own transaction, under the per-file lock; the photo is
 * only reconciled once that transaction has committed. Unlinking inside it
 * would be a write that no rollback can undo, so a transaction that failed at
 * COMMIT would leave its row on the board with its picture already gone. The
 * reconciler takes the same lock again and rechecks the references before it
 * unlinks, so a concurrent upload of the same content-addressed file still
 * cannot lose its picture in the gap.
 */
export async function deleteLostItem(id: number): Promise<boolean> {
  const deletedFileName = await db.transaction(async (tx) => {
    // Read the name first so there is something to lock on. A row's file_name
    // is never rewritten, so it cannot go stale between here and the lock.
    const [target] = await tx
      .select({ fileName: sousakutenLostItems.fileName })
      .from(sousakutenLostItems)
      .where(eq(sousakutenLostItems.id, id));
    if (!target) return null;

    await lockLostItemFile(tx, target.fileName);

    const [deleted] = await tx
      .delete(sousakutenLostItems)
      .where(eq(sousakutenLostItems.id, id))
      .returning({ fileName: sousakutenLostItems.fileName });
    return deleted ? deleted.fileName : null;
  });

  if (deletedFileName === null) return false;

  await discardUnreferencedImage(deletedFileName);
  return true;
}
