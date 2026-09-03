import type { Metadata } from "next";

import { FloatingMenu } from "@/app/components/FloatingMenu";
import {
  CLUB,
  CLUB_PERFORMANCE,
  COMMITTEE,
  COMMITTEE_PERFORMANCE,
  type Department,
  KAITAKU,
  KAITAKU_PERFORMANCE,
  OTHER,
  OTHERS_PERFORMANCE,
  type Performance,
  RISSI,
  RISSI_PERFORMANCE,
  type RubyText,
  SOUSAKU,
  SOUSAKU_PERFORMANCE,
} from "@/lib/exhibits";
import { destinationFor } from "@/lib/festival";

import styles from "./exhibits.module.css";

const DESTINATION = destinationFor("/exhibits");

function RubyTextContent({
  text,
  rubyText,
}: {
  text: string;
  rubyText?: RubyText;
}) {
  if (!rubyText) return text;

  return text.split(rubyText.text).map((part, index, parts) => (
    <span key={index}>
      {part}
      {index < parts.length - 1 && (
        <ruby className={styles.ruby}>
          {rubyText.text}
          <rt className={styles.rt}>{rubyText.ruby}</rt>
        </ruby>
      )}
    </span>
  ));
}

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

function PerformanceCard({
  department,
  performances,
}: {
  department: Department;
  performances: Performance[];
}) {
  return (
    <div className={styles.main} id={department.romaji}>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionKicker}>{department.romaji}</p>
          <h2>{department.name}</h2>
        </div>
        <div className={styles.performanceList}>
          {performances.map((performance) => {
            const rubyText = performance.RubyText;

            return (
              <article className={styles.performance} key={performance.name}>
                <h3>
                  {performance.name} :{" "}
                  <RubyTextContent
                    text={performance.title}
                    rubyText={rubyText}
                  />
                </h3>
                {performance.description && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {performance.description}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function ExhibitsPage() {
  return (
    <>
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.romaji}>{DESTINATION.romaji}</p>
          <h1 className={styles.title}>{DESTINATION.label}</h1>
        </header>
      </div>

      <PerformanceCard department={RISSI} performances={RISSI_PERFORMANCE} />
      <PerformanceCard
        department={KAITAKU}
        performances={KAITAKU_PERFORMANCE}
      />
      <PerformanceCard
        department={SOUSAKU}
        performances={SOUSAKU_PERFORMANCE}
      />
      <PerformanceCard department={CLUB} performances={CLUB_PERFORMANCE} />

      <PerformanceCard
        department={COMMITTEE}
        performances={COMMITTEE_PERFORMANCE}
      />

      <PerformanceCard department={OTHER} performances={OTHERS_PERFORMANCE} />

      <FloatingMenu
        items={[
          { label: "立志部門", href: "#RISSI" },
          { label: "開拓部門", href: "#KAITAKU" },
          { label: "創作部門", href: "#SOUSAKU" },
          { label: "部活動", href: "#CLUB" },
          { label: "委員会", href: "#COMMITTEE" },
          { label: "その他の展示", href: "#OTHER" },
        ]}
      />
    </>
  );
}
