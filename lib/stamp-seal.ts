/**
 * Geometry for the hand-carved look of a stamp seal.
 *
 * The wobble is baked into the path data rather than applied with an SVG
 * filter. A feTurbulence/feDisplacementMap pair would give the same ink-bleed
 * effect, but the card renders 47 seals at once and that is 47 live filters to
 * rasterise on a phone. Perturbing the geometry costs nothing at paint time,
 * and — because the perturbation is seeded from the spot id — every exhibit
 * gets its own permanently distinct seal instead of 47 copies of one texture.
 *
 * Everything here is deterministic: the same id always carves the same seal,
 * on the server and in the browser, today and next year.
 */

/** FNV-1a. Small, stable, and not a security boundary — just a seed. */
function hashSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — one line of state, good enough for picking phases. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SealVariation = {
  /** Degrees the whole seal is tilted, so a grid of them never looks printed. */
  readonly tilt: number;
  /** Outer ring, as SVG path data. */
  readonly outerRing: string;
  /** Inner hairline ring. */
  readonly innerRing: string;
};

const POINTS = 72;

/**
 * A closed ring whose radius breathes by a fraction of a percent, drawn as a
 * Catmull-Rom spline so the variation reads as a carved edge and not as a
 * polygon. Two smoothly-varying sine terms with seeded phases give an organic
 * wobble; pure per-point noise would look like static.
 */
function wobblyRing(
  radius: number,
  amplitude: number,
  random: () => number,
): string {
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;
  const lobesA = 3 + Math.floor(random() * 3); // 3–5
  const lobesB = 6 + Math.floor(random() * 4); // 6–9

  const points: Array<[number, number]> = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;
    const wobble =
      0.62 * Math.sin(angle * lobesA + phaseA) +
      0.38 * Math.sin(angle * lobesB + phaseB);
    const r = radius * (1 + amplitude * wobble);
    points.push([50 + r * Math.cos(angle), 50 + r * Math.sin(angle)]);
  }

  const at = (i: number) => points[(i + POINTS) % POINTS];
  const round = (n: number) => Math.round(n * 100) / 100;

  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < POINTS; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    // Catmull-Rom → cubic Bézier control points.
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    path += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x2)} ${round(y2)}`;
  }
  return `${path}Z`;
}

export function sealVariation(spotId: string): SealVariation {
  const random = seededRandom(hashSeed(spotId));
  return {
    tilt: (random() - 0.5) * 7,
    outerRing: wobblyRing(43, 0.014, random),
    innerRing: wobblyRing(36.5, 0.011, random),
  };
}

export type ArcChar = {
  readonly char: string;
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
};

/**
 * Lays `text` out along the bottom of the seal, reading left to right and
 * fanning outward — the "smile" arc, upright at the lowest point.
 *
 * Each glyph carries its own transform rather than riding a <textPath>: a
 * textPath needs a <path id>, and 47 seals on one card would need 47 unique
 * ids kept from colliding with each other and with anything else on the page.
 */
export function arcChars(
  text: string,
  radius: number,
  stepDegrees: number,
): readonly ArcChar[] {
  const chars = [...text];
  // 90° is the bottom of the circle in SVG coordinates (y grows downward).
  const start = 90 + ((chars.length - 1) * stepDegrees) / 2;
  return chars.map((char, index) => {
    const degrees = start - index * stepDegrees;
    const radians = (degrees * Math.PI) / 180;
    return {
      char,
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
      rotate: degrees - 90,
    };
  });
}
