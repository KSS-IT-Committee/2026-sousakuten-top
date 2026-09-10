import { qrPathFor } from "@/lib/qr";

import styles from "./PersonalQr.module.css";

type QrCodeProps = {
  /** The string the symbol encodes — see lib/personal-code.ts. */
  value: string;
  /** Only for the accessible name; the symbol never renders it. */
  username: string;
};

/**
 * The quiet zone the QR spec requires around a symbol, in modules. Scanners
 * rely on it to find the symbol's edges, so it is part of the image rather
 * than CSS padding — a caller cropping the element must not be able to eat it.
 */
const QUIET_ZONE_MODULES = 4;

/**
 * One account's personal code as an inline SVG.
 *
 * Black on white in BOTH themes, hardcoded on purpose. A camera reads
 * reflectance, not semantics: rendering this with the page's palette would
 * hand dark-mode users a light-on-dark symbol, which many scanners reject
 * outright and the rest read slowly. The card behind it is kept light for the
 * same reason (see .panel in PersonalQr.module.css).
 */
export function QrCode({ value, username }: QrCodeProps) {
  const { size, path } = qrPathFor(value);
  const extent = size + QUIET_ZONE_MODULES * 2;

  return (
    <svg
      className={styles.qr}
      viewBox={`0 0 ${extent} ${extent}`}
      role="img"
      aria-label={`${username} の個人QRコード`}
      // Modules are whole units in this coordinate system, so antialiasing
      // between them only softens the edges a scanner is looking for.
      shapeRendering="crispEdges"
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      <path
        d={path}
        fill="#000000"
        transform={`translate(${QUIET_ZONE_MODULES} ${QUIET_ZONE_MODULES})`}
      />
    </svg>
  );
}
