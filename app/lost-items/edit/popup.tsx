"use client";

import { useActionState, useState } from "react";

import {
  ALLOWED_IMAGE_LABEL,
  IMAGE_ACCEPT,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_BYTES,
} from "@/lib/lost-items";

import { type LostItemFormState, submitLostItemAction } from "./actions";
import styles from "./edit.module.css";

const INITIAL_STATE: LostItemFormState = {
  error: null,
  message: null,
};

export default function LostItemEditPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      const nextState = await submitLostItemAction(previousState, formData);
      if (nextState.message !== null) setIsOpen(false);
      return nextState;
    },
    INITIAL_STATE,
  );

  const megabytes = Math.floor(MAX_IMAGE_BYTES / 1024 / 1024);
  return (
    <>
      <button className={styles.popupButton} onClick={() => setIsOpen(true)}>
        忘れ物を追加
      </button>
      {isOpen && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupWindow}>
            <form className={styles.popupForm} action={formAction}>
              <div className={styles.field}>
                <h2 className={styles.popupTitle}>忘れ物を追加</h2>
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
                  {ALLOWED_IMAGE_LABEL}、{megabytes}MBまで。
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
              {state.message !== null && (
                <p className={styles.formStatus} role="status">
                  {state.message}
                </p>
              )}
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
                onClick={() => setIsOpen(false)}
              >
                閉じる
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
