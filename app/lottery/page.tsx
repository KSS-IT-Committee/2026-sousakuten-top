import type { Metadata } from "next";

import { FloatingMenu } from "@/app/components/FloatingMenu";
import { destinationFor } from "@/lib/festival";
import {
  buildDayListings,
  ENTRIES,
  EXCLUDED_COUNT,
  PERFORMANCES,
  WINNER_COUNT,
} from "@/lib/lottery";

import styles from "./lottery.module.css";
import { LotterySearch } from "./LotterySearch";

const DESTINATION = destinationFor("/lottery");

const CONTACT_ADDRESS = "koishikawa.itcommittee@gmail.com";

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description:
    "校外の方を対象とした劇観覧抽選の結果。公演ごとの当選番号一覧と、抽選番号の検索。",
};

const DAYS = buildDayListings();

export default function LotteryPage() {
  return (
    <>
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.romaji}>{DESTINATION.romaji}</p>
          <h1 className={styles.title}>{DESTINATION.label}</h1>
          <p className={styles.lead}>
            校外の方を対象とした劇観覧抽選の結果をお知らせします。
            お申込みの際にお伝えした抽選番号で、ご確認ください。
          </p>
        </header>

        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>抽選番号について</h2>
          <p>
            抽選番号は、お申込み後に送信されたメールに記載の
            <strong>受付番号から下2桁を除いた末尾4桁</strong>の数字です。
          </p>
          <p className={styles.example}>
            例：受付番号 <code>AE00046805</code> → 抽選番号 <code>0468</code>
          </p>
        </section>

        <LotterySearch />

        <section className={styles.stats}>
          <dl className={styles.statList}>
            <div className={styles.stat}>
              <dt>お申込み</dt>
              <dd>{ENTRIES.length}件</dd>
            </div>
            <div className={styles.stat}>
              <dt>当選</dt>
              <dd>{WINNER_COUNT}件</dd>
            </div>
            <div className={styles.stat}>
              <dt>抽選対象外</dt>
              <dd>{EXCLUDED_COUNT}件</dd>
            </div>
            <div className={styles.stat}>
              <dt>公演数</dt>
              <dd>{PERFORMANCES.length}公演</dd>
            </div>
          </dl>
        </section>

        <section className={styles.listing}>
          <h2 className={styles.sectionTitle}>公演ごとの当選番号</h2>
          <p className={styles.sectionNote}>
            1件のお申込みで複数の公演に当選している場合があります。
            抽選対象外となったお申込みは、この一覧には含まれません。
          </p>

          {DAYS.map((day) => (
            <div key={day.date} className={styles.day}>
              <h3 className={styles.dayTitle}>{day.dateLabel}</h3>

              {day.stages.map((stage) => (
                <div key={stage.key} className={styles.stage}>
                  <h4 className={styles.stageTitle}>
                    {stage.stageLabel}
                    <span className={styles.stageTime}>{stage.timeLabel}</span>
                  </h4>

                  <div className={styles.classGrid}>
                    {stage.classes.map(({ performance, numbers }) => (
                      <section
                        key={performance.id}
                        className={styles.classCard}
                      >
                        <h5 className={styles.className}>
                          {performance.classLabel}
                          <span className={styles.classCount}>
                            {numbers.length}件
                          </span>
                        </h5>
                        {numbers.length === 0 ? (
                          <p className={styles.empty}>
                            校外の方の当選はありません
                          </p>
                        ) : (
                          <ul className={styles.numbers}>
                            {numbers.map((number) => (
                              <li key={number} className={styles.number}>
                                {number}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className={styles.notes}>
          <h2 className={styles.sectionTitle}>ご注意</h2>
          <ul className={styles.noteList}>
            <li>
              掲載しているのは校外の方の抽選番号のみです。校内の方の結果は別途お知らせします。
            </li>
            <li>
              お申込みの取消や、同じ観覧枠を重複して選択されたお申込みは抽選対象外としています。
              番号を検索すると、その旨が表示されます。
            </li>
            <li>
              番号が見つからない場合や、記載内容にお心当たりのない場合は、
              <a className={styles.link} href={`mailto:${CONTACT_ADDRESS}`}>
                {CONTACT_ADDRESS}
              </a>
              までお問い合わせください。
            </li>
          </ul>
        </section>
      </div>
      <FloatingMenu items={[{ label: "Top", href: "/" }]} />
    </>
  );
}
