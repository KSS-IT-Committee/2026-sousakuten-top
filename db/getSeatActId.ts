import { and, eq } from "drizzle-orm";

import { lotteryExternalResults, lotteryResults } from "@/db/schema";
import { db } from "@/lib/db";
import { type SeatKind, SOUSAKU_LOTTERY_ID } from "@/lib/reception";

/**
 * The class whose play a 創作部門 seat is for ("6A"), or null when there is no
 * such seat. It decides who may record the seat's arrival, so it is read off
 * the seat itself, never taken from the request. A seat's act never changes
 * after the draw — 譲渡 moves only its holder — so it cannot go stale between
 * this read and the write that follows it.
 */
export async function getSeatActId(
  kind: SeatKind,
  seatId: number,
): Promise<string | null> {
  if (kind === "school") {
    const [seat] = await db
      .select({ actId: lotteryResults.actId })
      .from(lotteryResults)
      .where(
        and(
          eq(lotteryResults.id, seatId),
          eq(lotteryResults.lotteryId, SOUSAKU_LOTTERY_ID),
        ),
      );
    return seat?.actId ?? null;
  }

  const [seat] = await db
    .select({ actId: lotteryExternalResults.actId })
    .from(lotteryExternalResults)
    .where(
      and(
        eq(lotteryExternalResults.id, seatId),
        eq(lotteryExternalResults.lotteryId, SOUSAKU_LOTTERY_ID),
      ),
    );
  return seat?.actId ?? null;
}
