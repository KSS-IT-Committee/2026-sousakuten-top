import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { deleteImageFile } from "@/lib/lost-item-images";
import { lockLostItemFile } from "@/lib/lost-item-lock";

import { sousakutenLostItems } from "./schema";

/**
 * Removes a photo once nothing on the board is using it any more — the shared
 * reconciler both the add and the delete path finish with.
 *
 * Two things make it safe. The per-file lock: a name is the hash of its bytes,
 * so an upload of a photo that is already on the board writes the very same
 * file, and the lock holds this off until that upload has committed and its row
 * is visible here. And running after the writing transaction has ended rather
 * than inside it: an unlink cannot be rolled back, so a transaction that fails
 * at COMMIT would otherwise leave its row on the board with no picture.
 */
export async function discardUnreferencedImage(
  fileName: string,
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await lockLostItemFile(tx, fileName);
      const referencing = await tx
        .select({ id: sousakutenLostItems.id })
        .from(sousakutenLostItems)
        .where(eq(sousakutenLostItems.fileName, fileName));
      if (referencing.length === 0) {
        await deleteImageFile(fileName);
      }
    });
  } catch (err) {
    // Best effort: the caller's own outcome is what the operator needs to hear,
    // and a file left behind is harmless — the next identical upload reuses it.
    console.error("写真ファイルの後始末に失敗しました:", err);
  }
}
