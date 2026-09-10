import { db } from "@/lib/db";
import { saveImageFile } from "@/lib/lost-item-images";
import { lockLostItemFile } from "@/lib/lost-item-lock";

import { sousakutenLostItems } from "./schema";

/**
 * Writes the photo and its row together, under the per-file lock, so a delete
 * running at the same moment cannot take the file away between the two. The
 * file is written first: a row is never allowed to exist without its picture,
 * whereas a picture without a row is harmless (it is content-addressed, so the
 * next identical upload reuses it).
 */
export async function addLostItem(item: {
  description: string | null;
  fileName: string;
  imageBytes: Buffer;
  uploadedBy: string;
}) {
  const { imageBytes, ...row } = item;
  await db.transaction(async (tx) => {
    await lockLostItemFile(tx, row.fileName);
    await saveImageFile(row.fileName, imageBytes);
    await tx.insert(sousakutenLostItems).values(row);
  });
}
