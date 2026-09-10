import { arcChars, sealVariation } from "@/lib/stamp-seal";
import type { StampGroup, StampSpot } from "@/lib/stamps";

import styles from "./Stamp.module.css";

/**
 * Ink colour per department. Real 朱印 are all vermillion, but a card of 47
 * identical red circles is a wall of noise — the visitor's actual question is
 * "which floor still owes me a stamp", and colour answers it at a glance.
 * These are deep enough to hold their own on the paper card and are drawn from
 * the same family as --accent / --accent-alt.
 */
const INK: Record<StampGroup, string> = {
  rissi: "#c1442a",
  kaitaku: "#1f6f5c",
  sousaku: "#7a1520",
  club: "#23318b",
  committee: "#8a6d1f",
  other: "#5b3a86",
};

/** Carved around the bottom rim. Kept short — an arc has little room. */
const RIM_TEXT: Record<StampGroup, string> = {
  rissi: "RISSI",
  kaitaku: "KAITAKU",
  sousaku: "SOUSAKU",
  club: "CLUB",
  committee: "IINKAI",
  other: "OTHER",
};

type StampProps = {
  spot: StampSpot;
  isCollected: boolean;
};

/**
 * One exhibit's seal, collected or not.
 *
 * An uncollected spot is drawn as an empty socket — a dashed rule and the
 * label greyed back — rather than omitted, because the whole point of a rally
 * card is seeing what you have not visited yet. Both states occupy exactly the
 * same box, so filling one in never reflows the card.
 */
export function Stamp({ spot, isCollected }: StampProps) {
  const { tilt, outerRing, innerRing } = sealVariation(spot.id);
  const ink = INK[spot.group];
  const rim = arcChars(RIM_TEXT[spot.group], 30, 11);

  // Size the carving to fit, rather than by line count alone: "1A" and
  // "パソコン" both sit on one line but need very different sizes, and three
  // characters at a two-character size would run into the inner ring. 54 is
  // the usable width inside that ring, so 54/longest is the widest a glyph
  // can be; the second term keeps a short label from ballooning.
  const lineCount = spot.sealLines.length;
  const longestLine = Math.max(
    ...spot.sealLines.map((line) => [...line].length),
  );
  const fontSize = Math.min(54 / longestLine, lineCount > 1 ? 17 : 26);

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${styles.seal} ${isCollected ? styles.collected : styles.empty}`}
      role="img"
      aria-label={
        isCollected
          ? `${spot.name} のスタンプ（取得済み）`
          : `${spot.name} のスタンプ（未取得）`
      }
    >
      {isCollected ? (
        <g transform={`rotate(${tilt.toFixed(2)} 50 50)`} fill={ink}>
          <path d={outerRing} fill="none" stroke={ink} strokeWidth={4.2} />
          <path d={innerRing} fill="none" stroke={ink} strokeWidth={1} />

          {spot.sealLines.map((line, index) => (
            <text
              key={line}
              className={styles.sealText}
              x={50}
              y={50 + (index - (lineCount - 1) / 2) * fontSize * 1.12}
              fontSize={fontSize}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {line}
            </text>
          ))}

          {rim.map(({ char, x, y, rotate }, index) => (
            <text
              key={`${char}-${index}`}
              className={styles.rimText}
              x={x}
              y={y}
              fontSize={5.4}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${rotate.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})`}
            >
              {char}
            </text>
          ))}
        </g>
      ) : (
        <g>
          <circle
            cx={50}
            cy={50}
            r={43}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeDasharray="4 5"
          />
          {spot.sealLines.map((line, index) => (
            <text
              key={line}
              className={styles.sealText}
              x={50}
              y={50 + (index - (lineCount - 1) / 2) * fontSize * 1.12}
              fontSize={fontSize}
              fill="currentColor"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
