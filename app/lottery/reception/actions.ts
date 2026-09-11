"use server";

import { refresh } from "next/cache";

import { addSeatCheckin } from "@/db/addSeatCheckin";
import { deleteSeatCheckin } from "@/db/deleteSeatCheckin";
import { getSeatPerformance } from "@/db/getSeatPerformance";
import { hasAnyRole } from "@/lib/access";
import {
  findReceptionAct,
  findReceptionSlot,
  formatJstTime,
  receptionDeadline,
  type SeatKind,
} from "@/lib/reception";
import { canRecordArrivals, RECEPTION_ROLES } from "@/lib/reception-access";
import { receptionNow } from "@/lib/reception-clock";
import { getCurrentUser, type SessionUser } from "@/lib/session";

export type CheckinResult =
  | { status: "saved" }
  | { status: "failed"; error: string }
  // The seat had arrived before this tap reached the server — from another
  // phone, or an earlier tap whose answer got lost. It stays 来場 at that
  // first time, and the desk is told: it may be one ticket used twice.
  | { status: "alreadyArrived"; checkedInAt: string };

type CheckinOutcome =
  | { status: "saved" }
  | { status: "missing" }
  | { status: "forbidden"; actId: string }
  | { status: "closed"; deadline: Date }
  | { status: "already"; checkedInAt: Date };

function isSeatKind(value: unknown): value is SeatKind {
  return value === "school" || value === "external";
}

async function applyCheckin(
  operator: SessionUser,
  kind: SeatKind,
  seatId: number,
  isArrived: boolean,
): Promise<CheckinOutcome> {
  const seat = await getSeatPerformance(kind, seatId);
  const slot = seat === null ? null : findReceptionSlot(seat.slotId);
  if (seat === null || slot === null) return { status: "missing" };
  if (!canRecordArrivals(operator, seat.actId)) {
    return { status: "forbidden", actId: seat.actId };
  }
  // 「5分前の時点で不在の場合、当選は無効」: from the 受付締切 on, the list is
  // final — no late arrival, and no taking one back either.
  const deadline = receptionDeadline(slot);
  if (receptionNow().getTime() >= deadline.getTime()) {
    return { status: "closed", deadline };
  }
  if (!isArrived) {
    await deleteSeatCheckin(kind, seatId);
    return { status: "saved" };
  }
  const added = await addSeatCheckin(kind, seatId, operator.username);
  return added.status === "added" ? { status: "saved" } : added;
}

/**
 * Records (isArrived = true) or takes back (false) one seat's arrival.
 *
 * Only a member of the class whose play the seat is for may do either, and
 * only until that performance's 受付締切; both are read off the seat, never
 * taken from the caller. Safe to repeat both ways, because a desk's phones
 * race each other and a flaky connection replays taps: arriving twice keeps
 * the first time (and says so), and taking back a seat that is not checked in
 * does nothing. Ends with refresh(), so the response carries the re-rendered
 * list and the tapping phone sees the confirmed state — other phones' taps
 * included — without waiting for a poll.
 */
export async function setSeatCheckinAction(
  kind: SeatKind,
  seatId: number,
  isArrived: boolean,
): Promise<CheckinResult> {
  const operator = await getCurrentUser();
  if (operator === null || !hasAnyRole(operator, RECEPTION_ROLES)) {
    return { status: "failed", error: "受付を記録する権限がありません。" };
  }
  // An action is a public POST endpoint: its arguments are whatever the
  // caller sent, whatever the signature above says.
  if (
    !isSeatKind(kind) ||
    !Number.isSafeInteger(seatId) ||
    seatId <= 0 ||
    typeof isArrived !== "boolean"
  ) {
    return {
      status: "failed",
      error: "記録する座席が正しく指定されていません。",
    };
  }

  let outcome: CheckinOutcome;
  try {
    outcome = await applyCheckin(operator, kind, seatId, isArrived);
  } catch (err) {
    console.error("受付の記録に失敗しました:", err);
    return {
      status: "failed",
      error: "記録に失敗しました。もう一度タップしてください。",
    };
  }

  // Re-render in this same response whatever happened: to confirm the tap, to
  // take a seat that no longer exists off the stale list, or to show a list
  // this account may not record on as read-only.
  refresh();
  if (outcome.status === "missing") {
    return {
      status: "failed",
      error:
        "この座席は見つかりませんでした。チケットが破棄された可能性があります。",
    };
  }
  if (outcome.status === "forbidden") {
    const label = findReceptionAct(outcome.actId)?.label ?? outcome.actId;
    return {
      status: "failed",
      error: `この公演の来場を記録できるのは、${label}の生徒だけです。`,
    };
  }
  if (outcome.status === "closed") {
    return {
      status: "failed",
      error: `受付締切（${formatJstTime(outcome.deadline)}）を過ぎたため、この公演の来場記録は変更できません。`,
    };
  }
  if (outcome.status === "already") {
    return {
      status: "alreadyArrived",
      checkedInAt: outcome.checkedInAt.toISOString(),
    };
  }
  return { status: "saved" };
}
