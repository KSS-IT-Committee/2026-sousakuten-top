import type { Metadata } from "next";

// import {
//   END_TIME,
  // FESTIVAL_DATE,
//   FESTIVAL_HOURS,
//   KAITAKU_PERFORMANCE,
//   RISSI_PERFORMANCE,
//   SOUSAKU_PERFORMANCE,
//   START_ENTER_TIME,
// } from "@/lib/schedule";
import { END_TIME, FESTIVAL_DATE, FESTIVAL_HOURS, START_ENTER_TIME } from "@/lib/schedule";

import { destinationFor } from "@/lib/festival";

const DESTINATION = destinationFor("/schedule");

import styles from "./schedule.module.css";

export const metadata: Metadata = {
  title: "タイムテーブル | 創作展2026",
  description: "創作展2026の公演・発表の時間割",
};

type title =  {
  name: string;
  romaji:string;
}

type Performance = {
  readonly number: string;
  readonly time: string;
};

function TTSection({
  title,
  performances,
}: {
  title: title;
  performances: readonly Performance[];
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title.name}</h2>
      <p className={styles.sectionRomaji}>{title.romaji}</p>
    </section>
  );
}

export default function SchedulePage() {
  return (
    <>
      <header className={styles.header}>
        <p className={styles.romaji}>{DESTINATION.romaji}</p>
        <h1 className={styles.title}>{DESTINATION.label}</h1>
      </header>
      <div className={styles.content}>
        <h2>開催日時</h2>
        <p className={styles.festivalDate}>{FESTIVAL_DATE}</p>
        <h2>開場時間</h2>
        <p className={styles.startEnterTime}>入場開始 : {START_ENTER_TIME}</p>
        <p className={styles.festivalHours}>午前の部 : {FESTIVAL_HOURS.AM}</p>
        <p className={styles.festivalHours}>午後の部 : {FESTIVAL_HOURS.PM}</p>
        <div className={styles.note}>午前の部と午後の部の間は昼休憩です。来場者の皆様は3F アリーナでお待ちください。</div>
        <p className={styles.endTime}>終了時間 : {END_TIME}</p>
      </div>
    </>
  );
}
