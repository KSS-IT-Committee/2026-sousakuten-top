import Image from "next/image";

import {
  FESTIVAL_DATE_LABEL_EN,
  FESTIVAL_NUMBER,
  VENUE_NAME
} from "@/lib/festival";

import styles from "./Hero.module.css";

/**
 * The opening screen: a still from the teaser video with the theme set over it
 * as real text.
 *
 * The still is decorative, so it carries `alt=""` — the theme below it is the
 * page's h1 and the only thing a screen reader should announce here. The
 * frame is one of the clip's first twelve, the only ones without the title
 * burned into the footage.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <Image
        className={styles.photo}
        src="/hero-books.jpg"
        alt=""
        fill
        sizes="100vw"
        preload
      />
      <div className={styles.wash} aria-hidden="true" />

      <div className={styles.copy}>
        <p className={styles.kai}>第{FESTIVAL_NUMBER}回 創作展</p>
        <section className={styles.theme}>
          <h1 className={styles.theme_1}>正解</h1>
          <h2 className={styles.theme_2}>なんて</h2>
          <h1 className={styles.theme_1}>創</h1>
          <h2 className={styles.theme_2}>ればいい</h2>
        </section>
        <p className={styles.dates}>{FESTIVAL_DATE_LABEL_EN}</p>
        <p className={styles.venue}>{VENUE_NAME}</p>
      </div>

      <div className={styles.cue} aria-hidden="true">
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
}
