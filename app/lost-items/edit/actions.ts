"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";

import { addLostItem } from "@/db/addLostItem";
import { deleteLostItem } from "@/db/deleteLostItem";
import { hasAnyRole } from "@/lib/access";
import { detectImageType } from "@/lib/lost-item-images";
import {
  ALLOWED_IMAGE_LABEL,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_BYTES,
} from "@/lib/lost-items";
import { LOST_ITEM_ADMIN_ROLES } from "@/lib/lost-items-access";
import { getCurrentUser } from "@/lib/session";

export type LostItemFormState = {
  error: string | null;
  message: string | null;
};

async function operatorOrNull() {
  const operator = await getCurrentUser();
  if (operator === null || !hasAnyRole(operator, LOST_ITEM_ADMIN_ROLES)) {
    return null;
  }
  return operator;
}

function revalidate() {
  revalidatePath("/lost-items");
  revalidatePath("/lost-items/edit");
}

/**
 * The name a photo is stored under: the SHA-256 of its bytes plus the extension
 * the bytes themselves imply. Two uploads collide on a name only when they are
 * the same picture, which is what lets the serving route mark these URLs
 * immutable.
 */
function imageFileName(bytes: Buffer, ext: string): string {
  return `${createHash("sha256").update(bytes).digest("hex")}${ext}`;
}

export async function submitLostItemAction(
  _previousState: LostItemFormState,
  formData: FormData,
): Promise<LostItemFormState> {
  const operator = await operatorOrNull();
  if (operator === null) {
    return { error: "忘れ物を追加する権限がありません。", message: null };
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "写真を選んでください。", message: null };
  }
  if (image.size > MAX_IMAGE_BYTES) {
    const limit = Math.floor(MAX_IMAGE_BYTES / 1024 / 1024);
    return { error: `写真は${limit}MBまでです。`, message: null };
  }

  // The browser's Content-Type comes from the file extension, so it is only a
  // hint — the bytes decide. A renamed HEIC (what phones produce) lands here
  // labelled image/jpeg and is turned away rather than published unviewable.
  const bytes = Buffer.from(await image.arrayBuffer());
  const detected = detectImageType(bytes);
  if (detected === null) {
    return {
      error: `写真は${ALLOWED_IMAGE_LABEL}のいずれかにしてください。iPhoneのHEIC形式は、JPEGに変換してからアップロードしてください。`,
      message: null,
    };
  }

  const rawDescription = formData.get("description");
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      error: `説明は${MAX_DESCRIPTION_LENGTH}文字までです。`,
      message: null,
    };
  }

  try {
    // Writes the file and the row together under the per-file lock. If the row
    // fails, the file is left behind rather than cleaned up: it is the same
    // file a photo already on the board would be using, so removing it would
    // break that row.
    await addLostItem({
      description: description === "" ? null : description,
      fileName: imageFileName(bytes, detected.ext),
      imageBytes: bytes,
      uploadedBy: operator.username,
    });
  } catch (err) {
    console.error("忘れ物の追加に失敗しました:", err);
    return { error: "忘れ物の追加に失敗しました。", message: null };
  }

  revalidate();
  return { error: null, message: "忘れ物を追加しました。" };
}

export async function deleteLostItemAction(
  _previousState: LostItemFormState,
  formData: FormData,
): Promise<LostItemFormState> {
  const operator = await operatorOrNull();
  if (operator === null) {
    return { error: "忘れ物を削除する権限がありません。", message: null };
  }

  const rawId = formData.get("id");
  if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
    return { error: "削除する忘れ物が指定されていません。", message: null };
  }
  // The digits still have to land on a real id. Without this, "0" matches no
  // row yet still reports success, and anything past 2^53 either rounds onto a
  // different id or reaches Postgres as 1e+21, which an int4 cannot parse.
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { error: "削除する忘れ物が指定されていません。", message: null };
  }

  try {
    // Removes the row, and the photo too once the last row using it is gone —
    // both under the per-file lock, inside one transaction.
    await deleteLostItem(id);
  } catch (err) {
    console.error("忘れ物の削除に失敗しました:", err);
    return { error: "忘れ物の削除に失敗しました。", message: null };
  }

  revalidate();
  return { error: null, message: "忘れ物を削除しました。" };
}
