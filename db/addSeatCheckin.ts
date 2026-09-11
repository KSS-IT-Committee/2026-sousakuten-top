import { and, eq } from "drizzle-orm";

import {
  lotteryExternalResultCheckins,
  lotteryExternalResults,
  lotteryResultCheckins,
  lotteryResults,
} from "@/db/schema";
import { db } from "@/lib/db";
import { type SeatKind, SOUSAKU_LOTTERY_ID } from "@/lib/reception";

export type AddSeatCheckinResult =
  /** No such 創作部門 seat: it was 破棄された, or the id is not one. */
  | { status: "missing" }
  /** This call recorded the arrival. */
  | { status: "added" }
  /** The seat had arrived already, at checkedInAt — which stays on record. */
  | { status: "already"; checkedInAt: Date };

/**
 * Records that one 創作部門 seat has arrived.
 *
 * A seat that has arrived already keeps its FIRST time, and the caller hears
 * about it: a second phone checking in a ticket the first one has already let
 * in is exactly the double entry a desk must be told about, while a tap
 * replayed over a flaky connection must not move the recorded time later.
 *
 * The seat row is locked (FOR NO KEY UPDATE) for the transaction, and
 * deleteSeatCheckin takes the same lock, so the check-ins and undos of one
 * seat run one at a time: the time read back after a conflicting insert is
 * always still there, and a 破棄 racing the tap waits for it and then takes
 * the check-in along, instead of failing the insert on a foreign key that
 * just vanished.
 */
export async function addSeatCheckin(
  kind: SeatKind,
  seatId: number,
  checkedInBy: string,
): Promise<AddSeatCheckinResult> {
  return db.transaction(async (tx) => {
    if (kind === "school") {
      const [seat] = await tx
        .select({ id: lotteryResults.id })
        .from(lotteryResults)
        .where(
          and(
            eq(lotteryResults.id, seatId),
            eq(lotteryResults.lotteryId, SOUSAKU_LOTTERY_ID),
          ),
        )
        .for("no key update");
      if (!seat) return { status: "missing" };

      const [added] = await tx
        .insert(lotteryResultCheckins)
        .values({ resultId: seat.id, checkedInBy })
        .onConflictDoNothing()
        .returning({ resultId: lotteryResultCheckins.resultId });
      if (added) return { status: "added" };

      const [existing] = await tx
        .select({ checkedInAt: lotteryResultCheckins.checkedInAt })
        .from(lotteryResultCheckins)
        .where(eq(lotteryResultCheckins.resultId, seat.id));
      return alreadyArrived(existing);
    }

    const [seat] = await tx
      .select({ id: lotteryExternalResults.id })
      .from(lotteryExternalResults)
      .where(
        and(
          eq(lotteryExternalResults.id, seatId),
          eq(lotteryExternalResults.lotteryId, SOUSAKU_LOTTERY_ID),
        ),
      )
      .for("no key update");
    if (!seat) return { status: "missing" };

    const [added] = await tx
      .insert(lotteryExternalResultCheckins)
      .values({ externalResultId: seat.id, checkedInBy })
      .onConflictDoNothing()
      .returning({
        externalResultId: lotteryExternalResultCheckins.externalResultId,
      });
    if (added) return { status: "added" };

    const [existing] = await tx
      .select({ checkedInAt: lotteryExternalResultCheckins.checkedInAt })
      .from(lotteryExternalResultCheckins)
      .where(eq(lotteryExternalResultCheckins.externalResultId, seat.id));
    return alreadyArrived(existing);
  });
}

// The check-in an insert just collided with. It cannot have gone in between:
// its seat is locked, and everything that removes a check-in — an undo, 破棄,
// a reload of the seats — has to take that lock first.
function alreadyArrived(
  existing: { checkedInAt: Date } | undefined,
): AddSeatCheckinResult {
  if (!existing) {
    throw new Error(
      "A conflicting check-in vanished while its seat was locked.",
    );
  }
  return { status: "already", checkedInAt: existing.checkedInAt };
}
