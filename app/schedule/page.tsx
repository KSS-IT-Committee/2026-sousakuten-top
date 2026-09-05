import type { Metadata } from "next";

import { destinationFor } from "@/lib/festival";
import {
  clubPerformanceTime,
  END_TIME,
  FESTIVAL_DATE,
  FESTIVAL_HOURS,
  KAITAKU_PERFORMANCE,
  RISSI_PERFORMANCE,
  SOUSAKU_PERFORMANCE,
  START_ENTER_TIME,
} from "@/lib/schedule";

const DESTINATION = destinationFor("/schedule");

import styles from "./schedule.module.css";

export const metadata: Metadata = {
  title: "タイムテーブル | 創作展2026",
  description: "創作展2026の公演・発表の時間割",
};

type SectionTitle = {
  name: string;
  romaji: string;
};

type Performance = {
  readonly number: string;
  readonly time: string;
};

const PROGRAMS = [
  {
    title: { name: "立志", romaji: "Rissi" },
    performances: Object.entries(RISSI_PERFORMANCE).map(([number, time]) => ({
      number: number === "AM" ? "午前" : "午後",
      time,
    })),
  },
  {
    title: { name: "開拓", romaji: "Kaitaku" },
    performances: Object.entries(KAITAKU_PERFORMANCE).map(([number, time]) => ({
      number: `第${number}公演`,
      time,
    })),
  },
  {
    title: { name: "創作", romaji: "Sousaku" },
    performances: Object.entries(SOUSAKU_PERFORMANCE).map(([number, time]) => ({
      number: `第${number}公演`,
      time,
    })),
  },
] as const;

const CLUB_PROGRAMS = [
  {
    title: { name: "吹奏楽部", romaji: "Brass Band" },
    performances: Object.entries(clubPerformanceTime.BRASS_BAND[0]).map(
      ([number, time]) => ({ number: `第${number}公演`, time }),
    ),
    dates: clubPerformanceTime.BRASS_BAND[1],
    venue: clubPerformanceTime.BRASS_BAND[2],
  },
  {
    title: { name: "茶道部", romaji: "Sadou" },
    performances: Object.entries(clubPerformanceTime.SADOU[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.SADOU[1],
    venue: clubPerformanceTime.SADOU[2],
  },
  {
    title: { name: "交響楽団", romaji: "Philharmonic" },
    performances: Object.entries(clubPerformanceTime.PHILHARMONIC[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.PHILHARMONIC[1],
    venue: clubPerformanceTime.PHILHARMONIC[2],
  },
  {
    title: { name: "かるた部", romaji: "Karuta" },
    performances: Object.entries(clubPerformanceTime.KARUTA[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.KARUTA[1],
    venue: clubPerformanceTime.KARUTA[2],
  },
  {
    title: { name: "クイズ研究会", romaji: "Quiz" },
    performances: Object.entries(clubPerformanceTime.QUIZ[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.QUIZ[1],
    venue: clubPerformanceTime.QUIZ[2],
  },
  {
    title: { name: "料理部", romaji: "Cooking" },
    performances: Object.entries(clubPerformanceTime.COOKING[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.COOKING[1],
    venue: clubPerformanceTime.COOKING[2],
  },
  {
    title: { name: "合唱部", romaji: "Chorus" },
    performances: Object.entries(clubPerformanceTime.CHORUS[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.CHORUS[1],
    venue: clubPerformanceTime.CHORUS[2],
  },
  {
    title: { name: "演劇部", romaji: "Theater" },
    performances: Object.entries(clubPerformanceTime.THEATER[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.THEATER[1],
    venue: clubPerformanceTime.THEATER[2],
  },
  {
    title: { name: "ジャズ研究会", romaji: "Jazz" },
    performances: Object.entries(clubPerformanceTime.JAZZ[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.JAZZ[1],
    venue: clubPerformanceTime.JAZZ[2],
  },
  {
    title: { name: "化学部", romaji: "Chemistry" },
    performances: Object.entries(clubPerformanceTime.CHEMISTRY[0]).map(
      ([number, time]) => ({ number, time }),
    ),
    dates: clubPerformanceTime.CHEMISTRY[1],
    venue: clubPerformanceTime.CHEMISTRY[2],
  },
] as const;

function TTSection({
  title,
  performances,
  dates,
  venue,
}: {
  title: SectionTitle;
  performances: readonly Performance[];
  dates?: string;
  venue?: string;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <h3 className={styles.sectionTitle}>{title.name}</h3>
        <p className={styles.sectionRomaji}>{title.romaji}</p>
        {dates && venue && (
          <p className={styles.sectionMeta}>
            {dates} / {venue}
          </p>
        )}
      </div>
      <ol className={styles.performanceList}>
        {performances.map((performance) => (
          <li className={styles.performance} key={performance.number}>
            <span className={styles.performanceNumber}>
              {performance.number}
            </span>
            <time className={styles.performanceTime}>{performance.time}</time>
          </li>
        ))}
      </ol>
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
      <main className={styles.content}>
        <section className={styles.overview}>
          <p className={styles.eyebrow}>Event information</p>
          <h2>開催日時</h2>
          <p className={styles.festivalDate}>{FESTIVAL_DATE}</p>
          <dl className={styles.hours}>
            <div>
              <dt>入場開始</dt>
              <dd>{START_ENTER_TIME}</dd>
            </div>
            <div>
              <dt>午前の部</dt>
              <dd>{FESTIVAL_HOURS.AM}</dd>
            </div>
            <div>
              <dt>午後の部</dt>
              <dd>{FESTIVAL_HOURS.PM}</dd>
            </div>
            <div>
              <dt>終了時間</dt>
              <dd>{END_TIME}</dd>
            </div>
          </dl>
          <p className={styles.note}>
            午前の部と午後の部の間は昼休憩です。来場者の皆様は3F
            アリーナでお待ちください。
          </p>
        </section>
        <section
          className={styles.timetable}
          aria-labelledby="timetable-heading"
        >
          <div className={styles.timetableIntro}>
            <p className={styles.eyebrow}>Performance timetable</p>
            <h2 id="timetable-heading">公演タイムテーブル</h2>
            <p>各公演の開始・終了時間をご確認ください。</p>
          </div>
          <h3>クラスの公演時間</h3>
          <div className={styles.programGrid}>
            {PROGRAMS.map((program) => (
              <TTSection key={program.title.romaji} {...program} />
            ))}
          </div>
          <h3 id="club">部活動の公演時間</h3>
          <div className={styles.clubGrid}>
            {CLUB_PROGRAMS.map((program) => (
              <TTSection key={program.title.romaji} {...program} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
