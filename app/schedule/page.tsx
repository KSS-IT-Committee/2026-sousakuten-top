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
  readonly showNumber?: boolean;
};

type TimetableProgram = {
  title: SectionTitle;
  performances: readonly Performance[];
  dates?: string;
  venue?: string;
};

const GRAPH_START = 8 * 60 + 30;
const GRAPH_END = 15 * 60 + 30;
const GRAPH_WIDTH = GRAPH_END - GRAPH_START;

const PROGRAMS = [
  {
    title: { name: "立志部門", romaji: "Rissi" },
    performances: Object.entries(RISSI_PERFORMANCE).map(([number, time]) => ({
      number: number === "AM" ? "午前" : "午後",
      time,
    })),
  },
  {
    title: { name: "開拓部門", romaji: "Kaitaku" },
    performances: Object.entries(KAITAKU_PERFORMANCE).map(([number, time]) => ({
      number: `第${number}公演`,
      time,
    })),
  },
  {
    title: { name: "創作部門", romaji: "Sousaku" },
    performances: Object.entries(SOUSAKU_PERFORMANCE).map(([number, time]) => ({
      number: `第${number}公演`,
      time,
    })),
  },
] satisfies readonly TimetableProgram[];

const CLUB_PROGRAMS = [
  {
    title: { name: "吹奏楽部", romaji: "Brass Band" },
    performances: Object.entries(clubPerformanceTime.BRASS_BAND[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.BRASS_BAND[1],
    venue: clubPerformanceTime.BRASS_BAND[2],
  },
  {
    title: { name: "茶道部", romaji: "Sadou" },
    performances: Object.entries(clubPerformanceTime.SADOU[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.SADOU[1],
    venue: clubPerformanceTime.SADOU[2],
  },
  {
    title: {
      name: "小石川フィルハーモニーオーケストラ部",
      romaji: "Philharmonic",
    },
    performances: Object.entries(clubPerformanceTime.PHILHARMONIC[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.PHILHARMONIC[1],
    venue: clubPerformanceTime.PHILHARMONIC[2],
  },
  {
    title: { name: "競技かるた部", romaji: "Karuta" },
    performances: Object.entries(clubPerformanceTime.KARUTA[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.KARUTA[1],
    venue: clubPerformanceTime.KARUTA[2],
  },
  {
    title: { name: "クイズ研究会", romaji: "Quiz" },
    performances: Object.entries(clubPerformanceTime.QUIZ[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.QUIZ[1],
    venue: clubPerformanceTime.QUIZ[2],
  },
  {
    title: { name: "料理研究会", romaji: "Cooking" },
    performances: Object.entries(clubPerformanceTime.COOKING[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.COOKING[1],
    venue: clubPerformanceTime.COOKING[2],
  },
  {
    title: { name: "音楽研究会", romaji: "Chorus" },
    performances: Object.entries(clubPerformanceTime.CHORUS[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.CHORUS[1],
    venue: clubPerformanceTime.CHORUS[2],
  },
  {
    title: { name: "演劇部", romaji: "Theater" },
    performances: Object.entries(clubPerformanceTime.THEATER[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.THEATER[1],
    venue: clubPerformanceTime.THEATER[2],
  },
  {
    title: { name: "軽音楽研究会", romaji: "Jazz" },
    performances: Object.entries(clubPerformanceTime.JAZZ[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.JAZZ[1],
    venue: clubPerformanceTime.JAZZ[2],
  },
  {
    title: { name: "化学研究会", romaji: "Chemistry" },
    performances: Object.entries(clubPerformanceTime.CHEMISTRY[0]).map(
      ([number, time]) => ({ number, time, showNumber: !/^\d+$/.test(number) }),
    ),
    dates: clubPerformanceTime.CHEMISTRY[1],
    venue: clubPerformanceTime.CHEMISTRY[2],
  },
] satisfies readonly TimetableProgram[];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isAM(timeRange: string) {
  const [start] = timeRange
    .split("-")
    .map((time) => timeToMinutes(time.trim()));

  return start < timeToMinutes("11:45");
}

function timeRangeToPosition(timeRange: string) {
  const [start, end] = timeRange
    .split("-")
    .map((time) => timeToMinutes(time.trim()));

  const isAm = isAM(timeRange);
  const breakDuration = timeToMinutes("0:35");
  const GRAPH_START_AM = timeToMinutes("08:30");
  const GRAPH_START_PM = timeToMinutes("11:40"); // Adjusted to align with the graph's start for PM sessions
  const width = ((end - start) / GRAPH_WIDTH) * 106;

  if (start > GRAPH_START_PM) {
    const left =
      ((start - GRAPH_START_AM) / GRAPH_WIDTH) * 106 -
      (breakDuration / GRAPH_WIDTH) * 106;
    return { left: `${left}%`, width: `${width}%`, isAm };
  }
  if (start < GRAPH_START_PM && end > GRAPH_START_PM) {
    const left = ((start - GRAPH_START_AM) / GRAPH_WIDTH) * 106;
    const adjustedWidth = (20 / GRAPH_WIDTH) * 106;
    return { left: `${left}%`, width: `${adjustedWidth}%`, isAm };
  } else {
    const left = ((start - GRAPH_START_AM) / GRAPH_WIDTH) * 106;
    return { left: `${left}%`, width: `${width}%`, isAm };
  }
}

function isMoreCompactTimeRange(timeRange: string) {
  const [start, end] = timeRange
    .split("-")
    .map((time) => timeToMinutes(time.trim()));

  return end - start < 31;
}

function isCompactTimeRange(timeRange: string) {
  const [start, end] = timeRange
    .split("-")
    .map((time) => timeToMinutes(time.trim()));

  return 31 < end - start && end - start < 45;
}

function timeToScalePosition(time: string) {
  const minutes = timeToMinutes(time);
  const breakDuration = timeToMinutes("0:35"); // Adjusted to align with the graph's start for PM sessions
  const GRAPH_START_AM = timeToMinutes("08:30");
  const GRAPH_START_PM = timeToMinutes("11:40");
  if (minutes > GRAPH_START_PM) {
    const left =
      ((minutes - GRAPH_START_AM) / GRAPH_WIDTH) * 106 -
      (breakDuration / GRAPH_WIDTH) * 106;
    return `${left}%`;
  } else {
    const left = ((minutes - GRAPH_START_AM) / GRAPH_WIDTH) * 106;
    return `${left}%`;
  }
}

function TimeGrid({ programs }: { programs: readonly TimetableProgram[] }) {
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>
        <span className={styles.timelineLabel}>部門</span>
        <div className={styles.timeScale}>
          {[
            "08:30",
            "09:30",
            "10:30",
            "11:35",
            "12:30",
            "13:30",
            "14:30",
            "15:30",
          ].map((time) => (
            <time key={time} style={{ left: timeToScalePosition(time) }}>
              {time}
            </time>
          ))}
        </div>
      </div>
      <div className={styles.timelineBreak}>
        <span className={styles.timelineProgram}>昼休憩</span>
        <div className={styles.timelineTrack}>
          <div
            className={styles.breakBand}
            style={timeRangeToPosition("11:35 - 12:30")}
          >
            <span>休憩</span>
          </div>
        </div>
      </div>
      <div className={styles.timelineBody}>
        {programs.map((program) => (
          <div className={styles.timelineRow} key={program.title.romaji}>
            <div className={styles.timelineProgram}>
              <strong>{program.title.name}</strong>
              <span>{program.dates ?? program.title.romaji}</span>
              {program.venue && <span>{program.venue}</span>}
            </div>
            <div className={styles.timelineTrack}>
              {program.performances.map((performance) => (
                <div
                  className={`${styles.timelineBar} ${
                    isCompactTimeRange(performance.time)
                      ? styles.timelineBarCompact
                      : ""
                  } ${
                    isMoreCompactTimeRange(performance.time)
                      ? styles.timelineBarMoreCompact
                      : ""
                  }`}
                  key={performance.number}
                  style={timeRangeToPosition(performance.time)}
                  title={`${performance.showNumber === false ? "" : `${performance.number} `}${performance.time}`}
                >
                  {performance.showNumber !== false && (
                    <span>{performance.number}</span>
                  )}
                  <time>{performance.time}</time>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
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
          <TimeGrid programs={PROGRAMS} />
          <h3 id="club">部活動の公演時間</h3>
          <TimeGrid programs={CLUB_PROGRAMS} />
        </section>
      </main>
    </>
  );
}
