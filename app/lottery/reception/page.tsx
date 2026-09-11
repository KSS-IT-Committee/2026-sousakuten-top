import type { Metadata } from "next";
import Link from "next/link";

import { AuthGuard } from "@/app/components/AuthGuard";
import { getReceptionSeats } from "@/db/getReceptionSeats";
import {
  currentReceptionSlot,
  findReceptionAct,
  findReceptionSlot,
  RECEPTION_ACTS,
  RECEPTION_DAYS,
  RECEPTION_SLOTS,
  type ReceptionAct,
  receptionDeadline,
  type ReceptionSlot,
} from "@/lib/reception";
import {
  canRecordArrivals,
  classFromRoles,
  RECEPTION_ROLES,
} from "@/lib/reception-access";
import { receptionNow } from "@/lib/reception-clock";
import { getCurrentUser } from "@/lib/session";
import { pageMetadata } from "@/lib/site";

import styles from "./reception.module.css";
import { ReceptionList } from "./ReceptionList";

const PATHNAME = "/lottery/reception";

export const metadata: Metadata = pageMetadata({
  title: "創作部門 受付",
  description: "創作部門公演の当選者の来場を記録する、受付担当者用のページ。",
  isIndexable: false,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Everything is read inside the guard, so a visitor without the role never
// reaches the database and still gets a real 401/403.
export default function ReceptionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthGuard role={RECEPTION_ROLES}>
      <ReceptionContent searchParams={searchParams} />
    </AuthGuard>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function receptionHref(slot: ReceptionSlot, act: ReceptionAct) {
  return { pathname: PATHNAME, query: { slot: slot.id, act: act.id } };
}

async function ReceptionContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  // With nothing in the URL yet, open on the performance whose 受付 is under
  // way (or next), at the desk's own class.
  const slot =
    findReceptionSlot(firstValue(query.slot)) ??
    currentReceptionSlot(receptionNow());
  const act =
    findReceptionAct(firstValue(query.act)) ??
    findReceptionAct(user === null ? null : classFromRoles(user.roles)) ??
    RECEPTION_ACTS[0];
  const seats = await getReceptionSeats(slot.id, act.id);
  // Everyone the guard lets in may read every list; the performing class
  // records on its own, IT委員会 on all of them. The action enforces the same
  // rule on its own.
  const canRecord = user !== null && canRecordArrivals(user, act.id);

  return (
    <div className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>RECEPTION</p>
        <h1 className={styles.title}>創作部門 受付</h1>
        <p className={styles.lead}>
          自分のクラスの公演では、当選者が受付に来たらその行をタップして来場を記録してください。もう一度タップすると取り消せます。記録は裏で保存されるので、保存を待たずに次の人をタップできます。ほかのクラスの公演は閲覧のみです（IT委員はすべてのクラスの公演を記録できます）。受付締切（開演5分前）を過ぎると、その公演の記録は変更できなくなります。
        </p>
      </header>

      <nav className={styles.picker} aria-label="公演とクラスの選択">
        <ul className={styles.chips}>
          {RECEPTION_DAYS.map((day) => {
            // Switching days keeps the performance: 第二公演 stays 第二公演.
            const target =
              RECEPTION_SLOTS.find(
                (candidate) =>
                  candidate.dayId === day.id &&
                  candidate.number === slot.number,
              ) ?? slot;
            return (
              <li key={day.id}>
                <Link
                  className={styles.chip}
                  href={receptionHref(target, act)}
                  aria-current={day.id === slot.dayId ? "page" : undefined}
                  prefetch={false}
                  scroll={false}
                >
                  {day.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className={styles.chips}>
          {RECEPTION_SLOTS.filter(
            (candidate) => candidate.dayId === slot.dayId,
          ).map((candidate) => (
            <li key={candidate.id}>
              <Link
                className={styles.chip}
                href={receptionHref(candidate, act)}
                aria-current={candidate.id === slot.id ? "page" : undefined}
                prefetch={false}
                scroll={false}
              >
                {candidate.label}
                <span className={styles.chipTime}>{candidate.time}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className={styles.chips}>
          {RECEPTION_ACTS.map((candidate) => (
            <li key={candidate.id}>
              <Link
                className={styles.chip}
                href={receptionHref(slot, candidate)}
                aria-current={candidate.id === act.id ? "page" : undefined}
                prefetch={false}
                scroll={false}
              >
                {candidate.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section
        className={styles.performance}
        aria-labelledby="reception-performance"
      >
        <h2 id="reception-performance" className={styles.performanceTitle}>
          {act.label}
          <span className={styles.performanceWhen}>
            {slot.dayLabel} {slot.label}（{slot.time}）
          </span>
        </h2>
        <ReceptionList
          key={`${slot.id}/${act.id}`}
          seats={seats}
          renderedAt={receptionNow().toISOString()}
          deadline={receptionDeadline(slot).toISOString()}
          actLabel={act.label}
          canRecord={canRecord}
        />
      </section>
    </div>
  );
}
