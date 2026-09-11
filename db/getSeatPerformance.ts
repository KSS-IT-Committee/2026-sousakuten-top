import { and, eq } from "drizzle-orm";

import { lotteryExternalResults, lotteryResults } from "@/db/schema";
import { db } from "@/lib/db";
import { type SeatKind, SOUSAKU_LOTTERY_ID } from "@/lib/reception";

export type SeatPerformance = { slotId: string; actId: string };

/**
 * Which performance a 創作部門 seat is for — its slot, and the class whose
 * play it is — or null when there is no such seat. Together they decide
 * whether a tap on the seat may be recorded (by whom, and until when), so they
 * are read off the seat itself, never taken from the request. Neither changes
 * after the draw (譲渡 moves only the holder), so they cannot go stale between
 * this read and the write that follows it.
 */
export async function getSeatPerformance(
  kind: SeatKind,
  seatId: number,
): Promise<SeatPerformance | null> {
  if (kind === "school") {
    const [seat] = await db
      .select({ slotId: lotteryResults.slotId, actId: lotteryResults.actId })
      .from(lotteryResults)
      .where(
        and(
          eq(lotteryResults.id, seatId),
          eq(lotteryResults.lotteryId, SOUSAKU_LOTTERY_ID),
        ),
      );
    return seat ?? null;
  }

  const [seat] = await db
    .select({
      slotId: lotteryExternalResults.slotId,
      actId: lotteryExternalResults.actId,
    })
    .from(lotteryExternalResults)
    .where(
      and(
        eq(lotteryExternalResults.id, seatId),
        eq(lotteryExternalResults.lotteryId, SOUSAKU_LOTTERY_ID),
      ),
    );
  return seat ?? null;
}
