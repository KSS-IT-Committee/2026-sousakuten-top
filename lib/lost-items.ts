/**
 * The client-safe half of the 忘れ物 board's rules. The format allowlist and
 * everything that touches the filesystem live in lib/lost-item-images.ts,
 * which is server-only.
 */

// Public URL prefix for a stored photo, served by the
// app/lost-items-images/[name] route handler. Uploads do NOT live under
// public/: they go on the persistent /app/files mount, which is outside the
// build output, so Next cannot auto-serve them. It lives here rather than
// beside the rest of the image code because the edit page's client components
// build these URLs too, and that module is server-only.
export const IMAGE_URL_PREFIX = "/lost-items-images/";

/**
 * Upload cap. Sized for what the operators actually hold in their hands: HEIC
 * is rejected, so an iPhone photo arrives as a converted JPEG, and a 48MP shot
 * or an Android camera at full resolution clears 5MB on its own. 10MiB covers
 * a standard-mode phone photo without asking anyone to shrink anything at a
 * festival desk.
 *
 * Keep next.config.ts's serverActions.bodySizeLimit above this — it caps the
 * whole multipart body, and a request over THAT limit is rejected by Next
 * before the action runs, so it can never produce a readable error.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** MAX_IMAGE_BYTES as a whole number of MB, for the hint and the error. */
export const MAX_IMAGE_MB = Math.floor(MAX_IMAGE_BYTES / 1024 / 1024);

export const MAX_DESCRIPTION_LENGTH = 200;

/** `accept` for the file input. Advisory only — the bytes decide. */
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/avif";

export const ALLOWED_IMAGE_LABEL = "PNG・JPEG・GIF・WebP・AVIF";

/**
 * Why an upload was turned away for size. The limit on its own does not tell
 * an operator how far over they are, or what to do about it. Shared by the
 * client-side pre-check and the server action so the two cannot say different
 * things about the same file.
 */
export function imageTooLargeMessage(size: number): string {
  const actual = (size / 1024 / 1024).toFixed(1);
  return `写真は${MAX_IMAGE_MB}MBまでです。この写真は約${actual}MBあります。カメラの設定で解像度を下げて撮り直すか、別の写真を選んでください。`;
}
