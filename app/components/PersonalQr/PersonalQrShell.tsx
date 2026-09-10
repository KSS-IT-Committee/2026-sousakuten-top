"use client";

import { usePathname } from "next/navigation";
import { type MouseEvent, useRef } from "react";

import styles from "./PersonalQr.module.css";

/** The full-page version, and the button's href when JS never arrives. */
const QR_PAGE_PATH = "/qr";

type PersonalQrShellProps = {
  username: string;
  /** The rendered <QrCode>, built on the server by <PersonalQr>. */
  children: React.ReactNode;
};

/**
 * The always-visible entry point to the viewer's own QR code: a fixed button,
 * and the panel it opens.
 *
 * Deliberately NOT an entry in <FloatingMenu>. This gets shown at a door with
 * a queue behind you, so it is one tap from anywhere — and the symbol is
 * already in the page (rendered on the server, inside a closed <dialog>), so
 * opening it costs no navigation and no network. It sits bottom-LEFT because
 * the floating menu owns bottom-right.
 *
 * The button is a real link to /qr, upgraded to a dialog only when the click
 * is a plain left-click and the browser has <dialog>. Modifier and middle
 * clicks fall through so open-in-new-tab keeps working, and with no JS — or no
 * showModal — the href simply navigates to the full-page version.
 *
 * On /qr itself there is nothing left to open, so the whole control steps
 * aside rather than offering a dialog onto the page you are already reading.
 */
export function PersonalQrShell({ username, children }: PersonalQrShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const dialog = dialogRef.current;
    // Checked before preventDefault so an unsupported browser is left with a
    // working link rather than a dead button.
    if (!dialog || typeof dialog.showModal !== "function" || dialog.open) {
      return;
    }

    event.preventDefault();
    dialog.showModal();
  }

  if (pathname === QR_PAGE_PATH) return null;

  return (
    <>
      <a
        href={QR_PAGE_PATH}
        className={styles.button}
        aria-haspopup="dialog"
        onClick={handleOpen}
      >
        <svg
          className={styles.buttonIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3z" fill="currentColor" stroke="none" />
          <path d="M18 18h3v3h-3z" fill="currentColor" stroke="none" />
        </svg>
        QRコード
      </a>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="個人QRコード"
        // A press on the backdrop targets the <dialog> itself; anything
        // inside the panel targets the panel or its descendants.
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className={styles.panel}>
          <p className={styles.panelLabel}>個人QRコード</p>
          <div className={styles.qrFrame}>{children}</div>
          <p className={styles.username}>{username}</p>
          <p className={styles.hint}>
            読み取れないときは、画面の明るさを上げてください。
          </p>
          <button
            type="button"
            className={styles.close}
            onClick={() => dialogRef.current?.close()}
          >
            閉じる
          </button>
        </div>
      </dialog>
    </>
  );
}
