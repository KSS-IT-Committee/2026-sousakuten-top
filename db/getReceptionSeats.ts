import { and, eq } from "drizzle-orm";

import {
  lotteryExternalResultCheckins,
  lotteryExternalResults,
  lotteryResultCheckins,
  lotteryResults,
} from "@/db/schema";
import { db } from "@/lib/db";
import { type ReceptionSeat, SOUSAKU_LOTTERY_ID } from "@/lib/reception";

// 本人 before 保護者 when one account holds both.
const HOLDER_ORDER = { student: 0, parent: 1 } as const;

function byCodePoint(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Every seat of one 創作部門 performance of one class, with its arrival: the
 * school seats first, then the 校外 ones. Sorted here by code point rather
 * than by the database's collation, so students come before staff accounts
 * (k0087272) and the order is the same on every server.
 */
export async function getReceptionSeats(
  slotId: string,
  actId: string,
): Promise<ReceptionSeat[]> {
  const [schoolSeats, externalSeats] = await Promise.all([
    db
      .select({
        id: lotteryResults.id,
        username: lotteryResults.username,
        applicantType: lotteryResults.applicantType,
        partySize: lotteryResults.partySize,
        checkedInAt: lotteryResultCheckins.checkedInAt,
      })
      .from(lotteryResults)
      .leftJoin(
        lotteryResultCheckins,
        eq(lotteryResultCheckins.resultId, lotteryResults.id),
      )
      .where(
        and(
          eq(lotteryResults.lotteryId, SOUSAKU_LOTTERY_ID),
          eq(lotteryResults.slotId, slotId),
          eq(lotteryResults.actId, actId),
        ),
      ),
    db
      .select({
        id: lotteryExternalResults.id,
        receiptNumber: lotteryExternalResults.receiptNumber,
        lotteryNumber: lotteryExternalResults.lotteryNumber,
        partySize: lotteryExternalResults.partySize,
        checkedInAt: lotteryExternalResultCheckins.checkedInAt,
      })
      .from(lotteryExternalResults)
      .leftJoin(
        lotteryExternalResultCheckins,
        eq(
          lotteryExternalResultCheckins.externalResultId,
          lotteryExternalResults.id,
        ),
      )
      .where(
        and(
          eq(lotteryExternalResults.lotteryId, SOUSAKU_LOTTERY_ID),
          eq(lotteryExternalResults.slotId, slotId),
          eq(lotteryExternalResults.actId, actId),
        ),
      ),
  ]);

  schoolSeats.sort(
    (a, b) =>
      byCodePoint(a.username, b.username) ||
      HOLDER_ORDER[a.applicantType] - HOLDER_ORDER[b.applicantType],
  );
  externalSeats.sort((a, b) => byCodePoint(a.receiptNumber, b.receiptNumber));

  return [
    ...schoolSeats.map((seat): ReceptionSeat => ({
      key: `school-${seat.id}`,
      kind: "school",
      id: seat.id,
      label: seat.username,
      lotteryNumber: null,
      holderType: seat.applicantType,
      partySize: seat.partySize,
      checkedInAt: seat.checkedInAt?.toISOString() ?? null,
    })),
    ...externalSeats.map((seat): ReceptionSeat => ({
      key: `external-${seat.id}`,
      kind: "external",
      id: seat.id,
      label: seat.receiptNumber,
      lotteryNumber: seat.lotteryNumber,
      holderType: "external",
      partySize: seat.partySize,
      checkedInAt: seat.checkedInAt?.toISOString() ?? null,
    })),
  ];
}
