"use client";

import { type ReactNode, useEffect, useRef } from "react";

import styles from "./edit.module.css";

/**
 * The modal both lost-item popups open. A native <dialog> shown with
 * showModal() is what makes it accessible, and none of it is hand-rolled: the
 * element carries dialog semantics, keeps focus inside while open, closes on
 * Escape, takes the page behind it out of the tab order, and hands focus back
 * to the button that opened it.
 */
export function PopupDialog({
  isOpen,
  labelledBy,
  onClose,
  children,
}: {
  isOpen: boolean;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // showModal() is the only way to get the modal behaviour; the `open`
  // attribute alone renders a non-modal dialog that leaves the rest of the
  // page reachable.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.popupWindow}
      aria-labelledby={labelledBy}
      onClose={onClose}
    >
      {/* Mounted only while open so the form starts empty each time, the way
          it did when the whole popup was conditionally rendered. */}
      {isOpen && children}
    </dialog>
  );
}
