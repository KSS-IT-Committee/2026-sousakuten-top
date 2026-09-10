import qrcode from "qrcode-generator";

/**
 * A QR symbol reduced to what an <svg> needs: the module count along one
 * edge, and a single path covering every dark module.
 *
 * One path rather than one <rect> per module — a symbol this size is 25×25
 * or larger, and a few hundred elements is markup the browser has to lay out
 * on every page (the code rides in the layout). Runs of adjacent dark modules
 * in a row collapse into one subpath, which typically cuts the count by
 * around half again.
 */
export type QrPath = {
  /** Modules along one edge, excluding the quiet zone. */
  readonly size: number;
  /** SVG path data in module units — one unit per module, origin top-left. */
  readonly path: string;
};

/**
 * Error correction level. "M" (~15% recoverable) is the usual default and is
 * generous for a phone screen, which is backlit, flat and clean; a higher
 * level would only add modules, and denser modules scan *worse* on a small
 * display than a sparser symbol with less redundancy.
 */
const ERROR_CORRECTION_LEVEL = "M";

/** 0 asks the library to pick the smallest type number the data fits in. */
const AUTOMATIC_TYPE_NUMBER = 0;

export function qrPathFor(value: string): QrPath {
  const qr = qrcode(AUTOMATIC_TYPE_NUMBER, ERROR_CORRECTION_LEVEL);
  // Byte mode: personal codes are lowercase hex and may carry a lowercase
  // staff username, neither of which fits QR's alphanumeric character set.
  qr.addData(value, "Byte");
  qr.make();

  const size = qr.getModuleCount();
  const subpaths: string[] = [];

  for (let row = 0; row < size; row++) {
    let runStart: number | null = null;

    // Runs to col === size so a run touching the right edge is flushed by the
    // same branch as every other run.
    for (let col = 0; col <= size; col++) {
      const isDark = col < size && qr.isDark(row, col);

      if (isDark && runStart === null) {
        runStart = col;
      } else if (!isDark && runStart !== null) {
        subpaths.push(`M${runStart} ${row}h${col - runStart}v1H${runStart}z`);
        runStart = null;
      }
    }
  }

  return { size, path: subpaths.join("") };
}
