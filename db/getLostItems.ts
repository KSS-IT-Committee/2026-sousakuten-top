import { desc } from "drizzle-orm";

import { sousakutenLostItems } from "@/db/schema";
import { db } from "@/lib/db";

export type LostItem = {
  id: number;
  description: string | null;
  fileName: string;
  uploadedBy: string;
  createdAt: Date;
};

export async function getLostItems(): Promise<LostItem[]> {
  return db
    .select({
      id: sousakutenLostItems.id,
      description: sousakutenLostItems.description,
      fileName: sousakutenLostItems.fileName,
      uploadedBy: sousakutenLostItems.uploadedBy,
      createdAt: sousakutenLostItems.createdAt,
    })
    .from(sousakutenLostItems)
    .orderBy(desc(sousakutenLostItems.createdAt));
}
