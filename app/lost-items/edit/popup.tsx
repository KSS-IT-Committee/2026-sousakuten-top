"use client";

import { useActionState, useState } from "react";

import {
  ALLOWED_IMAGE_LABEL,
  IMAGE_ACCEPT,
  imageTooLargeMessage,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "@/lib/lost-items";

import { type LostItemFormState, submitLostItemAction } from "./actions";
import styles from "./edit.module.css";
import { PopupDialog } from "./popupDialog";

const INITIAL_STATE: LostItemFormState = {
  error: null,
  message: null,
};

const TITLE_ID = "lost-item-add-title";

export default function LostItemEditPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (previousState: LostItemFormState, formData: FormData) => {
      // Checked here as well as in the action because a body over
      // next.config.ts's serverActions.bodySizeLimit is rejected by Next
      // before the action runs — the operator would get a thrown error
      // instead of a message telling them the photo is too big.
      const image = formData.get("image");
      if (image instanceof File && image.size > MAX_IMAGE_BYTES) {
        return { error: imageTooLargeMessage(image.size), message: null };
      }
      const nextState = await submitLostItemAction(previousState, formData);
      if (nextState.message !== null) setIsOpen(false);
      return nextState;
    },
    INITIAL_STATE,
  );

  return (
    <>
      <button
        className={styles.popupButton}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        忘れ物を追加
      </button>
      <PopupDialog
        isOpen={isOpen}
        labelledBy={TITLE_ID}
        onClose={() => setIsOpen(false)}
      >
        <form className={styles.popupForm} action={formAction}>
          <h2 className={styles.popupTitle} id={TITLE_ID}>
            忘れ物を追加
          </h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="image">
              写真
            </label>
            <input
              id="image"
              type="file"
              name="image"
              accept={IMAGE_ACCEPT}
              required
              className={styles.imageInput}
            />
            <p className={styles.hint}>
              {ALLOWED_IMAGE_LABEL}、{MAX_IMAGE_MB}MBまで。
            </p>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              説明（任意）
            </label>
            <input
              id="description"
              type="text"
              name="description"
              className={styles.input}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="例：グラウンドで見つかった水筒"
            />
          </div>
          {state.error !== null && (
            <p className={styles.formStatus} role="alert">
              {state.error}
            </p>
          )}
          <div className={styles.actions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isPending}
            >
              {isPending ? "追加中…" : "追加"}
            </button>
            <button
              className={styles.popupCloseButton}
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
            >
              閉じる
            </button>
          </div>
        </form>
      </PopupDialog>
    </>
  );
}
