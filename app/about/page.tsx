import type { Metadata } from "next";

import { destinationFor } from "@/lib/festival";

import styles from "./about.module.css";

const DESTINATION = destinationFor("/about");

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

export default function AboutPage() {
  return (
    <article className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ABOUT SOUSAKUTEN</p>
        <h1 className={styles.title}>創作展とは</h1>
        <p className={styles.lead}>
          みんなで創り、みんなで楽しむ。創作展は、参加する一人ひとりの想いが集まって生まれる場所です。
        </p>
      </header>
  
      <section className={styles.section}>
        <p>
          創作展の目的は、創作展に参加する全ての団体が団結して一つのものを作り上げることを通じて、来場者の方を楽しませることです。
          また、参加する全ての人にとって思い出に残る創作展にすることです。
        </p>
      </section>

      <section className={styles.themeSection}>
        <p className={styles.eyebrow}>THEME 2026</p>
        <h2 className={styles.sectionTitle}>第94回創作展テーマ</h2>
        <blockquote className={styles.theme}>
          <span>正解なんて、創ればいい</span>
        </blockquote>
        <div className={styles.copy}>
          <p>突然ですが、みなさんにとっての正解とはなんでしょうか。</p>
          <p>
            創作展で失敗しないこと、周りの人と仲良くやること、はたまた創作展大賞を取ることなど、色々な正解があると思います。
            でも創作展はもっと自由なものです。
          </p>
          <p>
            失敗してしまうことだってある。初めて挑戦することだってあってもいい。そんな全ての行動と決断の結果が、皆さんの「正解」になると思います。
          </p>
          <p>
            今この場所、この瞬間、このメンバーでしか創れない創作展がきっとあります。皆さんの正解で、全ての人に魅せてください。
          </p>
        </div>
        <p className={styles.signature}>創作展委員会</p>
      </section>
    </article>
  );
}
