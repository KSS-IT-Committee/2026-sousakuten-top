"use server";

import { revalidatePath } from "next/cache";
import { forbidden, unauthorized } from "next/navigation";

import { getAllStampPassphrases } from "@/db/getStampPassphrases";
import { setStampPassphrase } from "@/db/setStampPassphrase";
import { hasAnyRole } from "@/lib/access";
import { generatePassphrase } from "@/lib/passphrase";
import { getCurrentUser } from "@/lib/session";
import {
  STAMP_PASSPHRASE_ROLES,
  STAMP_SPOTS,
  stampSpotById,
} from "@/lib/stamps";

/**
 * A server action is reachable by anyone who can guess its id, so the role is
 * checked here and not merely on the page that renders the button.
 */
async function requireCommittee(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) unauthorized();
  if (!hasAnyRole(user, STAMP_PASSPHRASE_ROLES)) forbidden();
  return user.username;
}

/**
 * Issue or rotate one booth's passphrase.
 *
 * Rotating takes effect at once, which means every poster already printed for
 * that booth is wrong from that moment — that is the point (it is how a
 * passphrase that leaked into a group chat gets retired), but it is also why
 * this is a deliberate per-booth button rather than anything automatic.
 */
export async function rotatePassphraseAction(formData: FormData) {
  const username = await requireCommittee();

  const spotId = formData.get("spotId");
  const spot = typeof spotId === "string" ? stampSpotById(spotId) : null;
  if (!spot) return;

  await setStampPassphrase({
    spotId: spot.id,
    passphrase: generatePassphrase(),
    updatedBy: username,
  });
  revalidatePath("/stamps/passphrases");
}

/**
 * Issue passphrases for every booth that has none, leaving existing ones
 * alone — so this is safe to press twice and will never invalidate a poster
 * that is already on a wall.
 */
export async function generateMissingPassphrasesAction() {
  const username = await requireCommittee();

  const existing = new Set(
    (await getAllStampPassphrases()).map((row) => row.spotId),
  );

  for (const spot of STAMP_SPOTS) {
    if (existing.has(spot.id)) continue;
    await setStampPassphrase({
      spotId: spot.id,
      passphrase: generatePassphrase(),
      updatedBy: username,
    });
  }
  revalidatePath("/stamps/passphrases");
}
