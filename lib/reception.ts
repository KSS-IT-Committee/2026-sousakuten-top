/* The 創作部門 viewing lottery as its reception desk sees it
 * (/lottery/reception): which performance (slot) and which class (act) a seat
 * admits to, and the plain shape one seat takes on the desk's list.
 *
 * The ids are the ones 2026-event-week-top's lib/lotteries.ts defines for the
 * "sousaku-performance" lottery, which 2026-lottery writes into
 * `lottery_results` and `lottery_external_results`; the labels and times are
 * copied from that same definition. Keep them in step — an id that drifts
 * matches no seat, and the desk just sees an empty list.
 *
 * No server-only import: the client list renders these labels too. */

export const SOUSAKU_LOTTERY_ID = "sousaku-performance";

/** 「公演開始5分前までに当選クラスの受付へ」 — the rule every ticket states. */
const RECEPTION_CLOSES_BEFORE_START_MS = 5 * 60 * 1000;

const FESTIVAL_DAYS = [
  { id: "sep12", label: "9月12日（土）", date: "2026-09-12" },
  { id: "sep13", label: "9月13日（日）", date: "2026-09-13" },
] as const;

// Both days run the same four performances.
const PERFORMANCES = [
  { label: "第一公演", time: "8:45～10:00", start: "08:45", end: "10:00" },
  { label: "第二公演", time: "10:20～11:35", start: "10:20", end: "11:35" },
  { label: "第三公演", time: "12:30～13:45", start: "12:30", end: "13:45" },
  { label: "第四公演", time: "14:05～15:20", start: "14:05", end: "15:20" },
] as const;

export type ReceptionDay = {
  readonly id: string;
  readonly label: string;
};

export type ReceptionSlot = {
  /** "sep12-slot-1" — the `slot_id` every seat carries. */
  readonly id: string;
  readonly dayId: string;
  readonly dayLabel: string;
  /** 1–4: the performance's place in its day. */
  readonly number: number;
  readonly label: string;
  /** 「8:45～10:00」 */
  readonly time: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
};

export type ReceptionAct = {
  /** "5A" — the `act_id` every seat carries. */
  readonly id: string;
  readonly label: string;
};

export const RECEPTION_DAYS: readonly ReceptionDay[] = FESTIVAL_DAYS.map(
  ({ id, label }) => ({ id, label }),
);

export const RECEPTION_SLOTS: readonly ReceptionSlot[] = FESTIVAL_DAYS.flatMap(
  (day) =>
    PERFORMANCES.map((performance, index) => ({
      id: `${day.id}-slot-${index + 1}`,
      dayId: day.id,
      dayLabel: day.label,
      number: index + 1,
      label: performance.label,
      time: performance.time,
      // Explicit +09:00: the production server does not run in JST.
      startsAt: new Date(`${day.date}T${performance.start}:00+09:00`),
      endsAt: new Date(`${day.date}T${performance.end}:00+09:00`),
    })),
);

// The 創作部門 classes — grades 5 and 6 — whose plays are the acts.
export const RECEPTION_ACTS: readonly ReceptionAct[] = [
  "5A",
  "5B",
  "5C",
  "5D",
  "6A",
  "6B",
  "6C",
  "6D",
].map((id) => ({ id, label: `${id[0]}年${id[1]}組` }));

export function findReceptionSlot(
  id: string | null | undefined,
): ReceptionSlot | null {
  return RECEPTION_SLOTS.find((slot) => slot.id === id) ?? null;
}

export function findReceptionAct(
  id: string | null | undefined,
): ReceptionAct | null {
  return RECEPTION_ACTS.find((act) => act.id === id) ?? null;
}

/**
 * The performance a desk opening the page is most likely working: the first
 * one that has not ended yet — so between two performances it is already the
 * next one, whose 受付 is what is going on. Before the festival that is the
 * very first performance; after it, the last.
 */
export function currentReceptionSlot(now: Date): ReceptionSlot {
  return (
    RECEPTION_SLOTS.find((slot) => now.getTime() < slot.endsAt.getTime()) ??
    RECEPTION_SLOTS[RECEPTION_SLOTS.length - 1]
  );
}

/** When a performance's 受付 closes: 5 minutes before it starts. */
export function receptionDeadline(slot: ReceptionSlot): Date {
  return new Date(slot.startsAt.getTime() - RECEPTION_CLOSES_BEFORE_START_MS);
}

/** How close to the 受付締切 the countdown turns red. */
export const RECEPTION_URGENT_BEFORE_DEADLINE_MS = 5 * 60 * 1000;

/**
 * 座席数 — the people one class's one performance admits. The draw
 * (2026-lottery's SEATS_PER_PERFORMANCE) awarded seats up to exactly this, so
 * once the 受付締切 has passed, whatever the arrivals leave is what the
 * キャンセル待ち列 gets.
 */
export const SEATS_PER_PERFORMANCE = 60;

/**
 * 「4分05秒」「12分」「8時間36分」 — the time left before the 受付締切, as
 * the desk reads it: to the second in the last 5 minutes, and in whole minutes
 * rounded up before that, so it never reads 0分 while there is still time.
 */
export function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  if (totalSeconds * 1000 <= RECEPTION_URGENT_BEFORE_DEADLINE_MS) {
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${Math.floor(totalSeconds / 60)}分${seconds}秒`;
  }
  const totalMinutes = Math.ceil(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}分`;
  return `${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`;
}

const JST_TIME = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
});

const JST_CLOCK = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** 「08:40」 — always JST, whatever the server's or the phone's timezone. */
export function formatJstTime(instant: Date): string {
  return JST_TIME.format(instant);
}

/** 「08:40:15」 — the same, to the second. */
export function formatJstClock(instant: Date): string {
  return JST_CLOCK.format(instant);
}

/** Which table a seat lives in: `lottery_results` or `lottery_external_results`. */
export type SeatKind = "school" | "external";

/** A school seat's `applicant_type` (本人 / 保護者), or 校外. */
export type SeatHolderType = "student" | "parent" | "external";

export const SEAT_HOLDER_LABELS: Record<SeatHolderType, string> = {
  // 本人 rather than 生徒: staff accounts win seats as 本人 too.
  student: "本人",
  parent: "保護者",
  external: "校外",
};

/** One seat on the desk's list — plain data, so it can cross to the client. */
export type ReceptionSeat = {
  /** Unique across both tables: "school-12" / "external-3". */
  readonly key: string;
  readonly kind: SeatKind;
  /** The row id in the seat's own table. */
  readonly id: number;
  /** The account a school seat is held by, or a 校外 seat's 受付番号. */
  readonly label: string;
  /** 校外 only: the 抽選番号 the result letters and /lottery use. */
  readonly lotteryNumber: string | null;
  readonly holderType: SeatHolderType;
  readonly partySize: number;
  /** ISO instant the seat arrived at the desk, or null while it has not. */
  readonly checkedInAt: string | null;
};

/**
 * Folds what the desk types into the form the list is matched in: full-width
 * characters to ASCII (a Japanese IME left in 全角 is the likely slip), upper
 * case, no spaces or hyphens.
 */
export function normalizeSeatQuery(input: string): string {
  return input
    .replace(/[！-～]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

/** Whether a seat's account, 受付番号 or 抽選番号 contains the query. */
export function seatMatchesQuery(
  seat: ReceptionSeat,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery === "") return true;
  return (
    seat.label.toUpperCase().includes(normalizedQuery) ||
    (seat.lotteryNumber?.includes(normalizedQuery) ?? false)
  );
}
