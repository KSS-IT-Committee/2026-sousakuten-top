import { eq } from "drizzle-orm";

import { sousakutenLostItems } from "@/db/schema";
import { db } from "@/lib/db";
import { deleteImageFile } from "@/lib/lost-item-images";
import { lockLostItemFile } from "@/lib/lost-item-lock";

/**
 * Removes the row, and the photo too once no row is left using it.
 *
 * The unlink deliberately happens INSIDE the transaction, while the per-file
 * lock is still held. Doing it afterwards is the race CodeRabbit flagged: the
 * reference count would be a snapshot, and a concurrent upload could commit a
 * row for the same content-addressed file in the gap before the file went away,
 * leaving that new row with no picture.
 */
export async function deleteLostItem(id: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    // Read the name first so there is something to lock on. A row's file_name
    // is never rewritten, so it cannot go stale between here and the lock.
    const [target] = await tx
      .select({ fileName: sousakutenLostItems.fileName })
      .from(sousakutenLostItems)
      .where(eq(sousakutenLostItems.id, id));
    if (!target) return false;

    await lockLostItemFile(tx, target.fileName);

    const [deleted] = await tx
      .delete(sousakutenLostItems)
      .where(eq(sousakutenLostItems.id, id))
      .returning({ fileName: sousakutenLostItems.fileName });
    if (!deleted) return false;

    const remaining = await tx
      .select({ id: sousakutenLostItems.id })
      .from(sousakutenLostItems)
      .where(eq(sousakutenLostItems.fileName, deleted.fileName));

    if (remaining.length === 0) {
      await deleteImageFile(deleted.fileName);
    }
    return true;
  });
}
