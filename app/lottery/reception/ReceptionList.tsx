"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useId,
  useOptimistic,
  useState,
  useTransition,
} from "react";

import {
  formatJstClock,
  formatJstTime,
  normalizeSeatQuery,
  type ReceptionSeat,
  SEAT_HOLDER_LABELS,
  seatMatchesQuery,
} from "@/lib/reception";

import { type CheckinResult, setSeatCheckinAction } from "./actions";
import styles from "./reception.module.css";

/**
 * How often the list re-reads the database. Several phones can work one desk,
 * and a tap on one should reach the others before the same visitor is let in
 * twice.
 */
const POLL_INTERVAL_MS = 10_000;

const OFFLINE_ERROR =
  "通信できませんでした。電波を確認して、もう一度タップしてください。";

type ArrivalChange = { key: string; checkedInAt: string | null };

/** What to tell the desk about one seat's last tap. */
type SeatNotice = { label: string; message: string };

function noticeFor(result: CheckinResult): string | null {
  if (result.status === "failed") return result.error;
  if (result.status === "alreadyArrived") {
    const time = formatJstTime(new Date(result.checkedInAt));
    return `この座席は${time}に来場済みとして記録されています。同じチケットで2回入場していないか確認してください。`;
  }
  return null;
}

function applyArrival(
  seats: readonly ReceptionSeat[],
  change: ArrivalChange,
): readonly ReceptionSeat[] {
  return seats.map((seat) =>
    seat.key === change.key
      ? { ...seat, checkedInAt: change.checkedInAt }
      : seat,
  );
}

function countPeople(seats: readonly ReceptionSeat[]): number {
  return seats.reduce((total, seat) => total + seat.partySize, 0);
}

/**
 * One performance of one class, as its 受付 works through it.
 *
 * A tap flips the seat on the same frame (useOptimistic) and hands the write
 * to a Server Action inside a transition, so nothing on the page waits for the
 * database: the desk can tap the next visitor straight away while the writes
 * — Next.js sends one page's actions one at a time — catch up behind it. Each
 * action ends with refresh(), whose re-render replaces the optimistic state
 * with the confirmed one; a write that fails rolls back only its own seat and
 * says so under it. A poll brings in the other phones' taps.
 *
 * For anyone outside the performing class the rows are read-only: the list
 * still polls and searches, it just cannot be tapped. The action refuses them
 * on its own, so this is only what the page shows, not the rule.
 */
export function ReceptionList({
  seats,
  renderedAt,
  canRecord,
}: {
  seats: readonly ReceptionSeat[];
  renderedAt: string;
  /** Whether this account may record arrivals here at all. */
  canRecord: boolean;
}) {
  const router = useRouter();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [notices, setNotices] = useState<ReadonlyMap<string, SeatNotice>>(
    () => new Map(),
  );
  const [isRefreshing, startRefresh] = useTransition();
  const [shownSeats, applyOptimisticArrival] = useOptimistic(
    seats,
    applyArrival,
  );

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        router.refresh();
      }
    }
    const timer = window.setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    // Catch up at once when the phone wakes up or gets its signal back.
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("online", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("online", refreshIfVisible);
    };
  }, [router]);

  function setSeatNotice(key: string, notice: SeatNotice | null) {
    setNotices((current) => {
      if (notice === null && !current.has(key)) return current;
      const next = new Map(current);
      if (notice === null) {
        next.delete(key);
      } else {
        next.set(key, notice);
      }
      return next;
    });
  }

  function toggleArrival(seat: ReceptionSeat) {
    if (!canRecord) return;
    const isArriving = seat.checkedInAt === null;
    setSeatNotice(seat.key, null);
    startTransition(async () => {
      applyOptimisticArrival({
        key: seat.key,
        checkedInAt: isArriving ? new Date().toISOString() : null,
      });
      let result: CheckinResult;
      try {
        result = await setSeatCheckinAction(seat.kind, seat.id, isArriving);
      } catch {
        // A dropped connection, or a deploy that retired this page's action.
        // Caught so it never reaches the error boundary, which would blank
        // the whole list in the middle of a queue.
        result = { status: "failed", error: OFFLINE_ERROR };
      }
      const message = noticeFor(result);
      if (message !== null) {
        const notice = { label: seat.label, message };
        // Past the await, so it needs its own transition to land together
        // with the optimistic arrival being rolled back.
        startTransition(() => setSeatNotice(seat.key, notice));
      }
    });
  }

  const normalizedQuery = normalizeSeatQuery(query);
  const visibleSeats = shownSeats.filter((seat) =>
    seatMatchesQuery(seat, normalizedQuery),
  );
  const arrivedSeats = shownSeats.filter((seat) => seat.checkedInAt !== null);
  // What the server last confirmed, to tell a saved seat from one in flight.
  const confirmedArrivals = new Map(
    seats.map((seat) => [seat.key, seat.checkedInAt !== null]),
  );
  // Notices for seats the server no longer lists — a ticket 破棄された while
  // the desk was tapping it. Their rows are gone, so they are shown above the
  // list instead, until dismissed.
  const orphanNotices = [...notices].filter(
    ([key]) => !confirmedArrivals.has(key),
  );

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.tally} aria-live="polite">
          来場
          <span className={styles.tallyCount}>{countPeople(arrivedSeats)}</span>
          /{countPeople(shownSeats)}名
          <span className={styles.tallyGroups}>
            （{arrivedSeats.length}/{shownSeats.length}組）
          </span>
        </p>
        <p className={styles.freshness}>
          {formatJstClock(new Date(renderedAt))} 時点
          <button
            className={styles.refresh}
            type="button"
            disabled={isRefreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            {isRefreshing ? "更新中…" : "最新にする"}
          </button>
        </p>
        <div className={styles.searchField}>
          <label className={styles.searchLabel} htmlFor={searchId}>
            アカウント・受付番号・抽選番号で探す
          </label>
          <input
            id={searchId}
            className={styles.search}
            type="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="6A07 / AE00046805 / 0468"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      {orphanNotices.length > 0 && (
        <div className={styles.orphanNotices} role="alert">
          {orphanNotices.map(([key, notice]) => (
            <p key={key}>
              {notice.label}：{notice.message}
            </p>
          ))}
          <button
            className={styles.refresh}
            type="button"
            onClick={() =>
              setNotices(
                (current) =>
                  new Map(
                    [...current].filter(([key]) => confirmedArrivals.has(key)),
                  ),
              )
            }
          >
            閉じる
          </button>
        </div>
      )}

      {shownSeats.length === 0 ? (
        <p className={styles.empty}>この公演の当選者はいません。</p>
      ) : visibleSeats.length === 0 ? (
        <p className={styles.empty}>「{query}」に一致する当選者はいません。</p>
      ) : (
        <ul className={styles.seats}>
          {visibleSeats.map((seat) => {
            const arrivedAt = seat.checkedInAt;
            const isArrived = arrivedAt !== null;
            const isSaving = isArrived !== confirmedArrivals.get(seat.key);
            const notice = notices.get(seat.key);
            return (
              <li key={seat.key}>
                <button
                  className={styles.seat}
                  type="button"
                  aria-pressed={isArrived}
                  data-saving={isSaving ? "" : undefined}
                  disabled={!canRecord}
                  onClick={() => toggleArrival(seat)}
                >
                  <span className={styles.seatName}>
                    <span className={styles.seatLabel}>{seat.label}</span>
                    {seat.lotteryNumber !== null && (
                      <span className={styles.seatSub}>
                        抽選番号 {seat.lotteryNumber}
                      </span>
                    )}
                  </span>
                  <span
                    className={styles.seatHolder}
                    data-holder={seat.holderType}
                  >
                    {SEAT_HOLDER_LABELS[seat.holderType]}
                  </span>
                  <span className={styles.seatParty}>{seat.partySize}名</span>
                  <span className={styles.seatStatus}>
                    {arrivedAt === null
                      ? "未"
                      : `✓ 来場 ${formatJstTime(new Date(arrivedAt))}`}
                  </span>
                  {isSaving && (
                    <span className={styles.seatSaving}>保存中…</span>
                  )}
                </button>
                {notice !== undefined && (
                  <p className={styles.seatError} role="alert">
                    {notice.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
