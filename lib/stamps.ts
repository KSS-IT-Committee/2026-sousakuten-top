import { ROLENAMES } from "@/db/schema";
import {
  CLUB_PERFORMANCE,
  COMMITTEE_PERFORMANCE,
  KAITAKU_PERFORMANCE,
  OTHERS_PERFORMANCE,
  type Performance,
  RISSI_PERFORMANCE,
  SOUSAKU_PERFORMANCE,
} from "@/lib/exhibits";

/**
 * The stamp-rally catalogue: every exhibit a visitor can collect a seal from.
 *
 * Spots are code, not rows. The DB stores only which stamps an account has
 * collected (`sousakuten_stamps.spot_id`) — the same split the viewing lottery
 * uses, where lib/lotteries.ts owns the definitions. Adding an exhibit is a
 * deploy, never a migration.
 *
 * The list itself is DERIVED from lib/exhibits.ts rather than retyped, so the
 * rally and the exhibit guide cannot drift apart. What this file adds per
 * exhibit is the three things a stamp needs and an exhibit entry has no room
 * for: a stable ASCII id that goes in the database, the few characters carved
 * into the seal, and who is allowed to grant it. Those live in SEALS below,
 * keyed by the exhibit's own name — and a name in one list without an entry in
 * the other throws at module load, which is a failed build rather than a
 * mystery at the booth.
 */

type Role = (typeof ROLENAMES)[number];

export type StampGroup =
  "rissi" | "kaitaku" | "sousaku" | "club" | "committee" | "other";

export type StampSpot = {
  /** Stable, ASCII, stored in `sousakuten_stamps.spot_id`. Never reuse one. */
  readonly id: string;
  /** Exhibit name, trimmed — several entries in exhibits.ts carry a stray space. */
  readonly name: string;
  readonly title: string;
  readonly floor: number;
  readonly location: string;
  readonly group: StampGroup;
  /** Characters carved into the seal, one string per line (at most two). */
  readonly sealLines: readonly string[];
  /**
   * Roles a granter must hold ALL of, or null when the booth is open to any
   * logged-in account.
   *
   * Class booths are staffed by their own class, which the existing role grid
   * already expresses: the 1A desk is "holds G1 AND ClassA". Clubs, committees
   * and the rest have no role of their own and are deliberately open to
   * everybody — an honour system, chosen knowing that any logged-in account
   * can therefore stamp a friend's card for a club neither of them visited.
   */
  readonly granterRoles: readonly Role[] | null;
};

type SealEntry = {
  readonly id: string;
  readonly sealLines: readonly string[];
};

/** Exhibit name (trimmed) → the parts of a stamp exhibits.ts cannot carry. */
const SEALS: Record<string, SealEntry> = {
  // 立志部門 / 開拓部門 / 創作部門 — the 24 classes. The seal is the class
  // code itself: on a card of 47, "3C" is found faster than any abbreviation.
  ...Object.fromEntries(
    [1, 2, 3, 4, 5, 6].flatMap((grade) =>
      ["A", "B", "C", "D"].map((letter) => [
        `${grade}年${letter}組`,
        {
          id: `${grade}${letter.toLowerCase()}`,
          sealLines: [`${grade}${letter}`],
        },
      ]),
    ),
  ),

  // 部活動. Names are shortened by hand — a seal fits four characters, not
  // 「小石川フィルハーモニーオーケストラ部」. Edit freely; only `id` is load-bearing.
  競技かるた部: { id: "karuta", sealLines: ["競技", "かるた"] },
  茶道部: { id: "chado", sealLines: ["茶道"] },
  小石川フィルハーモニーオーケストラ部: {
    id: "orchestra",
    sealLines: ["小石川", "管弦楽"],
  },
  吹奏楽部: { id: "suisogaku", sealLines: ["吹奏楽"] },
  クイズ研究会: { id: "quiz", sealLines: ["クイズ"] },
  "将棋・チェス部": { id: "shogi", sealLines: ["将棋", "チェス"] },
  華道部: { id: "kado", sealLines: ["華道"] },
  数学研究会: { id: "sugaku", sealLines: ["数学"] },
  英語研究会: { id: "eigo", sealLines: ["英語"] },
  物理研究会: { id: "butsuri", sealLines: ["物理"] },
  生物研究会: { id: "seibutsu", sealLines: ["生物"] },
  料理研究会: { id: "ryori", sealLines: ["料理"] },
  漫画研究会: { id: "manga", sealLines: ["漫画"] },
  パソコン研究会: { id: "pasocon", sealLines: ["パソコン"] },
  音楽研究会: { id: "ongaku", sealLines: ["音楽"] },
  軽音楽研究会: { id: "keiongaku", sealLines: ["軽音楽"] },
  天文研究会: { id: "tenmon", sealLines: ["天文"] },
  演劇部: { id: "engeki", sealLines: ["演劇"] },
  美術部: { id: "bijutsu", sealLines: ["美術"] },
  文芸部文芸班: { id: "bungei", sealLines: ["文芸"] },
  文芸部書道班: { id: "shodo", sealLines: ["書道"] },
  化学研究会: { id: "kagaku", sealLines: ["化学"] },

  // 委員会 / その他
  図書委員会: { id: "tosho", sealLines: ["図書"] },
  推し哲プロジェクト制作委員会: { id: "oshitetsu", sealLines: ["推し哲"] },
};

// Grade and class letter -> the role that stands for it. Spelled out rather
// than built as `G${n}` / `Class${letter}`, because a template literal is just
// a string to the compiler: these tables make the values real Roles, so a
// typo or a role renamed in ROLENAMES fails the build instead of silently
// producing a role nobody holds and a booth nobody can staff.
const GRADE_ROLES: Record<string, Role | undefined> = {
  "1": "G1",
  "2": "G2",
  "3": "G3",
  "4": "G4",
  "5": "G5",
  "6": "G6",
};

const CLASS_ROLES: Record<string, Role | undefined> = {
  A: "ClassA",
  B: "ClassB",
  C: "ClassC",
  D: "ClassD",
};

/** "1年A組" → ["G1", "ClassA"]; anything else → null (open to everybody). */
function granterRolesFor(name: string): readonly Role[] | null {
  const match = /^(\d)年([A-D])組$/.exec(name);
  if (!match) return null;

  const grade = GRADE_ROLES[match[1]];
  const letter = CLASS_ROLES[match[2]];
  if (!grade || !letter) {
    throw new Error(
      `No role pair for class "${name}" — add it to GRADE_ROLES / CLASS_ROLES in lib/stamps.ts.`,
    );
  }
  return [grade, letter];
}

function buildGroup(
  performances: readonly Performance[],
  group: StampGroup,
): readonly StampSpot[] {
  return performances.map((performance) => {
    const name = performance.name.trim();
    const seal = SEALS[name];
    if (!seal) {
      throw new Error(
        `No stamp seal registered for exhibit "${name}". Add it to SEALS in lib/stamps.ts (id + sealLines).`,
      );
    }
    return {
      id: seal.id,
      name,
      title: performance.title.trim(),
      floor: performance.floor,
      location: performance.location,
      group,
      sealLines: seal.sealLines,
      granterRoles: granterRolesFor(name),
    };
  });
}

export const STAMP_SPOTS: readonly StampSpot[] = [
  ...buildGroup(RISSI_PERFORMANCE, "rissi"),
  ...buildGroup(KAITAKU_PERFORMANCE, "kaitaku"),
  ...buildGroup(SOUSAKU_PERFORMANCE, "sousaku"),
  ...buildGroup(CLUB_PERFORMANCE, "club"),
  ...buildGroup(COMMITTEE_PERFORMANCE, "committee"),
  ...buildGroup(OTHERS_PERFORMANCE, "other"),
];

// The other half of the lockstep check: a seal nobody claimed means an exhibit
// was renamed or removed and left a dangling entry behind. Ids already in the
// database must NOT simply be deleted here — retire them deliberately.
const CLAIMED = new Set(STAMP_SPOTS.map((spot) => spot.name));
for (const name of Object.keys(SEALS)) {
  if (!CLAIMED.has(name)) {
    throw new Error(
      `SEALS has an entry for "${name}", which is not in lib/exhibits.ts. Remove it, or restore the exhibit.`,
    );
  }
}

const SPOT_BY_ID = new Map(STAMP_SPOTS.map((spot) => [spot.id, spot]));

/** Null for an unknown id — never trust a spot id off a URL or a form. */
export function stampSpotById(id: string): StampSpot | null {
  return SPOT_BY_ID.get(id) ?? null;
}

export const STAMP_GROUP_LABELS: Record<StampGroup, string> = {
  rissi: "立志部門",
  kaitaku: "開拓部門",
  sousaku: "創作部門",
  club: "部活動",
  committee: "委員会",
  other: "その他の展示",
};

/** Display order of the groups on the card. */
export const STAMP_GROUP_ORDER: readonly StampGroup[] = [
  "rissi",
  "kaitaku",
  "sousaku",
  "club",
  "committee",
  "other",
];

export const STAMP_TOTAL = STAMP_SPOTS.length;

/**
 * Whether `roles` may grant the stamp for `spot`.
 *
 * ALL of `granterRoles` must be held — the 1A desk wants G1 *and* ClassA, and
 * hasAnyRole would admit every first-year and every A-class in the school. It
 * is spelled out here rather than added to lib/access.ts because that file is
 * byte-identical across the five apps; a local rule stays local.
 */
export function canGrantStamp(roles: readonly string[], spot: StampSpot) {
  if (spot.granterRoles === null) return true;
  return spot.granterRoles.every((role) => roles.includes(role));
}

/**
 * Who may read and rotate the booth passphrase sheet. Everything on it is
 * readable by anyone standing at the relevant booth, but all of it at once is
 * the whole rally — so it sits behind a committee role.
 */
export const STAMP_PASSPHRASE_ROLES: readonly Role[] = [
  "Sousakuten",
  "SousakutenMain",
];

/** The spots this account may stamp, in catalogue order. */
export function grantableSpots(roles: readonly string[]): readonly StampSpot[] {
  return STAMP_SPOTS.filter((spot) => canGrantStamp(roles, spot));
}
