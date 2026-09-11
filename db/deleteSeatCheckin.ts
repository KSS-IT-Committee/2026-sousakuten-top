import { eq } from "drizzle-orm";

import {
  lotteryExternalResultCheckins,
  lotteryExternalResults,
  lotteryResultCheckins,
  lotteryResults,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { SeatKind } from "@/lib/reception";

/**
 * Takes a seat's arrival back — the desk tapped it by mistake. A check-in
 * that is already gone (another phone undid it first, or the seat was
 * 破棄された) is a no-op rather than an error: either way the seat now reads
 * 未来場, which is what the tap asked for.
 *
 * Takes the same per-seat lock as addSeatCheckin, so an undo can never land
 * between that function's insert and its read of the time on record.
 */
export async function deleteSeatCheckin(
  kind: SeatKind,
  seatId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    if (kind === "school") {
      await tx
        .select({ id: lotteryResults.id })
        .from(lotteryResults)
        .where(eq(lotteryResults.id, seatId))
        .for("no key update");
      await tx
        .delete(lotteryResultCheckins)
        .where(eq(lotteryResultCheckins.resultId, seatId));
      return;
    }

    await tx
      .select({ id: lotteryExternalResults.id })
      .from(lotteryExternalResults)
      .where(eq(lotteryExternalResults.id, seatId))
      .for("no key update");
    await tx
      .delete(lotteryExternalResultCheckins)
      .where(eq(lotteryExternalResultCheckins.externalResultId, seatId));
  });
}
