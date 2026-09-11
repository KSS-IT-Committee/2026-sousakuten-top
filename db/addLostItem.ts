import { db } from "@/lib/db";
import { saveImageFile } from "@/lib/lost-item-images";
import { lockLostItemFile } from "@/lib/lost-item-lock";

import { discardUnreferencedImage } from "./discardUnreferencedImage";
import { sousakutenLostItems } from "./schema";

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
      await discardUnreferencedImage(row.fileName);
    }
    throw err;
  }
}
