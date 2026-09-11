import { readFile } from "fs/promises";
import path from "path";

import { imageContentType, lostItemImagesDir } from "@/lib/lost-item-images";

// Uploaded photos live on the persistent /app/files mount, outside public/, so
// Next won't serve them automatically — this handler streams them back under
// the /lost-item-images/<name> URL stored in taiikusai_lost_items.file_name.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // The [name] segment is a single path component, but strip any directory
  // parts defensively so a crafted value can never escape the images dir.
  const dir = path.resolve(lostItemImagesDir());
  const filePath = path.resolve(dir, path.basename(name));
  if (path.dirname(filePath) !== dir) {
    return new Response("Not found", { status: 404 });
  }

  let file: Buffer;
  try {
    file = await readFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }
    throw err;
  }

  const contentType = imageContentType(filePath);

  const headers: Record<string, string> = {
    // Content-Type comes from the raster allowlist; never honor a sniffed type.
    "Content-Type": contentType ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    // Defense in depth: if this is ever opened as a top-level document,
    // sandbox + a null default-src stops any embedded script running in our
    // origin. Harmless for raster images, which load no subresources.
    "Content-Security-Policy": "default-src 'none'; sandbox",
    // Filenames embed a SHA-256 of the bytes (see saveImage), so a name can
    // only ever be reused for identical content.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  // Anything off the allowlist is forced to download rather than render.
  if (contentType === null) {
    headers["Content-Disposition"] = "attachment";
  }

  return new Response(new Uint8Array(file), { headers });
}
