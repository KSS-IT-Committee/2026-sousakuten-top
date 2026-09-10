import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { deleteImageFile, saveImageFile } from "@/lib/lost-item-images";
import { lockLostItemFile } from "@/lib/lost-item-lock";

import { sousakutenLostItems } from "./schema";

/**
 * Takes back a file whose row never landed. The rollback undoes the row but not
 * the write, so this reruns the delete's own reasoning: under the per-file lock,
 * remove the file only once no row is using it — two uploads of the same photo
 * share one content-addressed file, and a concurrent one holds the lock until it
 * commits, so its row is visible here rather than missed.
 */
async function discardUnreferencedFile(fileName: string): Promise<void> {
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
    // Best effort: the upload's own failure is what the operator needs to hear,
    // and a file left behind is harmless — the next identical upload reuses it.
    console.error("写真ファイルの後始末に失敗しました:", err);
  }
}

/**
 * Writes the photo and its row together, under the per-file lock, so a delete
 * running at the same moment cannot take the file away between the two. The
 * file is written first: a row is never allowed to exist without its picture.
 * If the insert then fails, the file is taken back again — unless another row
 * is already using it, since the name is the hash of the bytes.
 */
export async function addLostItem(item: {
  description: string | null;
  fileName: string;
  imageBytes: Buffer;
  uploadedBy: string;
}) {
  const { imageBytes, ...row } = item;
  let isFileWritten = false;
  try {
    await db.transaction(async (tx) => {
      await lockLostItemFile(tx, row.fileName);
      await saveImageFile(row.fileName, imageBytes);
      isFileWritten = true;
      await tx.insert(sousakutenLostItems).values(row);
    });
  } catch (err) {
    if (isFileWritten) {
      await discardUnreferencedFile(row.fileName);
    }
    throw err;
  }
}
