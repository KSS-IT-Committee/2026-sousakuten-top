import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";

import path from "path";

// Root of the per-container persistent files mount. In production and on PR
// previews the deploy bind-mounts a host dir at /app/files (it survives image
// swaps and blue/green), and FILES_DIR points at it from the Dockerfile.
// Locally it falls back to a gitignored dir so `next dev` works without the
// mount. Same contract as 2026-sousakuten-equipment-management.
function filesRoot(): string {
  return process.env.FILES_DIR ?? path.join(process.cwd(), "files-dev");
}

export function lostItemImagesDir(): string {
  return path.join(filesRoot(), "lost-item-images");
}

// Raster-only allowlist, matching equipment-management's. SVG is deliberately
// excluded: it is an active document format, so serving an uploaded SVG
// same-origin would let its embedded <script> run in our origin. HEIC is absent
// too — phones produce it constantly, but only Safari renders it, so it is
// better rejected at upload than published as a broken box.
type ImageSignature = {
  ext: string;
  mime: string;
  match: (bytes: Buffer) => boolean;
};

const IMAGE_SIGNATURES: ImageSignature[] = [
  {
    ext: ".png",
    mime: "image/png",
    match: (b) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    ext: ".jpg",
    mime: "image/jpeg",
    match: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: ".gif",
    mime: "image/gif",
    // "GIF87a" or "GIF89a"
    match: (b) =>
      b.length >= 6 &&
      b.toString("ascii", 0, 4) === "GIF8" &&
      (b[4] === 0x37 || b[4] === 0x39) &&
      b[5] === 0x61,
  },
  {
    ext: ".webp",
    mime: "image/webp",
    // RIFF....WEBP
    match: (b) =>
      b.length >= 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
  {
    ext: ".avif",
    mime: "image/avif",
    // ....ftyp<brand>, brand "avif"/"avis". A HEIC's brand is "heic", so it
    // does not match here.
    match: (b) =>
      b.length >= 12 &&
      b.toString("ascii", 4, 8) === "ftyp" &&
      ["avif", "avis"].includes(b.toString("ascii", 8, 12)),
  },
];

const EXT_CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * Identify an upload by its actual bytes, not its filename, so a disguised
 * payload cannot slip through on extension alone. Returns the canonical
 * extension and mime, or null when the bytes are not an allowed raster image.
 */
export function detectImageType(
  bytes: Buffer,
): { ext: string; mime: string } | null {
  const signature = IMAGE_SIGNATURES.find((candidate) =>
    candidate.match(bytes),
  );
  return signature ? { ext: signature.ext, mime: signature.mime } : null;
}

/**
 * Content-Type to serve a stored file with, or null when its extension is not
 * on the raster allowlist — the route then forces a download rather than
 * rendering it.
 */
export function imageContentType(fileName: string): string | null {
  return EXT_CONTENT_TYPE[path.extname(fileName).toLowerCase()] ?? null;
}

/** Writes a photo into the images dir, creating the dir on first use. */
export async function saveImageFile(
  fileName: string,
  bytes: Buffer,
): Promise<void> {
  const dir = lostItemImagesDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), bytes);
}

/**
 * Removes a stored photo. Missing is not an error — the same picture posted
 * twice shares one file, so a caller can race to remove an already-gone name.
 */
export async function deleteImageFile(fileName: string): Promise<void> {
  const dir = path.resolve(lostItemImagesDir());
  // basename() drops any directory parts, so this can only ever resolve to a
  // file directly inside the images dir — no traversal possible.
  const filePath = path.resolve(dir, path.basename(fileName));
  if (path.dirname(filePath) !== dir) return;

  try {
    await unlink(filePath);
  } catch (err) {
    // An already-missing file is fine; surface anything else without failing
    // the request the operator just completed.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("写真ファイルの削除に失敗しました:", err);
    }
  }
}
