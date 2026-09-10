"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { IMAGE_URL_PREFIX } from "@/lib/lost-items";

import { deleteLostItemAction, type LostItemFormState } from "./actions";
import styles from "./edit.module.css";

const INITIAL_STATE: LostItemFormState = {
  error: null,
  message: null,
};

export default function LostItemDeleteButton({
  id,
  fileName,
  description,
}: {
  id: number;
  fileName: string;
  description: string | null;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (previousState: LostItemFormState, formData: FormData) => {
      const nextState = await deleteLostItemAction(previousState, formData);
      if (nextState.message !== null) setIsDeleting(false);
      return nextState;
    },
    INITIAL_STATE,
  );

  return (
    <>
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => setIsDeleting(true)}
      >
        削除
      </button>
      {isDeleting && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupWindow}>
            <form className={styles.popupForm} action={formAction}>
              <input type="hidden" name="id" value={id} />
              <h2 className={styles.popupTitle}>本当に削除しますか？</h2>
              <Image
                src={`${IMAGE_URL_PREFIX}${fileName}`}
                alt={description ?? "忘れ物の写真"}
                width={400}
                height={400}
                className={styles.popupImage}
              />
              {state.error !== null && (
                <p className={styles.formStatus} role="alert">
                  {state.error}
                </p>
              )}
              <div className={styles.actions}>
                <button
                  className={styles.deleteButton}
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "削除中…" : "削除する"}
                </button>
                <button
                  className={styles.popupCloseButton}
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsDeleting(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
