import { eq } from "drizzle-orm";

import { sousakutenStampPassphrases } from "@/db/schema";
import { db } from "@/lib/db";

export type StampPassphraseRow = {
  spotId: string;
  passphrase: string;
  updatedBy: string | null;
  updatedAt: Date;
};

/** Every passphrase, for the committee's printing sheet. */
export async function getAllStampPassphrases(): Promise<StampPassphraseRow[]> {
  return db.select().from(sousakutenStampPassphrases);
}

/** The passphrase for one spot, or null when none has been generated yet. */
export async function getStampPassphrase(
  spotId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ passphrase: sousakutenStampPassphrases.passphrase })
    .from(sousakutenStampPassphrases)
    .where(eq(sousakutenStampPassphrases.spotId, spotId));

  return row?.passphrase ?? null;
}
