"use client";

import Link from "next/link";
import { useActionState } from "react";

import { claimStampAction, type ClaimState } from "./action";
import styles from "./spot.module.css";

const INITIAL: ClaimState = { status: "idle" };

/**
 * The passphrase box. Everything it reports comes back from the server action
 * — the client never decides whether a stamp was earned.
 */
export function ClaimForm({ spotId }: { spotId: string }) {
  const [state, formAction, isPending] = useActionState(
    claimStampAction,
    INITIAL,
  );

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="spotId" value={spotId} />

      <label className={styles.label} htmlFor="passphrase">
        合言葉
      </label>
      <input
        id="passphrase"
        name="passphrase"
        className={styles.input}
        // Uppercase, unambiguous letters and digits — turn off every helper
        // that would "fix" it into something else on a phone keyboard.
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        maxLength={32}
        required
        placeholder="ABC234"
        aria-describedby="passphrase-result"
      />

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "確認中…" : "スタンプを押す"}
      </button>

      {/* aria-live so the outcome is announced, not just repainted. */}
      <p id="passphrase-result" className={styles.result} aria-live="polite">
        {state.status === "collected" && (
          <span className={styles.ok}>
            {state.spotName} のスタンプを押しました！{" "}
            <Link className={styles.resultLink} href="/stamps">
              台紙を見る
            </Link>
          </span>
        )}
        {state.status === "already" && (
          <span className={styles.muted}>
            この展示のスタンプはすでに押されています。
          </span>
        )}
        {state.status === "wrong" && (
          <span className={styles.bad}>
            合言葉が違います。掲示をもう一度ご確認ください。
          </span>
        )}
        {state.status === "rate-limited" && (
          <span className={styles.bad}>
            入力の回数が多すぎます。{state.retryAfterSeconds}
            秒ほどおいてからお試しください。
          </span>
        )}
        {state.status === "unavailable" && (
          <span className={styles.bad}>
            この展示は合言葉での取得に対応していません。係の人にQRコードを見せてください。
          </span>
        )}
        {state.status === "signed-out" && (
          <span className={styles.bad}>
            ログインの有効期限が切れました。ログインし直してください。
          </span>
        )}
      </p>
    </form>
  );
}
