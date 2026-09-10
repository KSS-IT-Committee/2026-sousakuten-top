import { sousakutenStampPassphrases } from "@/db/schema";
import { db } from "@/lib/db";

/** Create or rotate one spot's passphrase. Rotating invalidates the old one. */
export async function setStampPassphrase(params: {
  spotId: string;
  passphrase: string;
  updatedBy: string;
}): Promise<void> {
  await db
    .insert(sousakutenStampPassphrases)
    .values({
      spotId: params.spotId,
      passphrase: params.passphrase,
      updatedBy: params.updatedBy,
    })
    .onConflictDoUpdate({
      target: sousakutenStampPassphrases.spotId,
      set: {
        passphrase: params.passphrase,
        updatedBy: params.updatedBy,
        updatedAt: new Date(),
      },
    });
}
