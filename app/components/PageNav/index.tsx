import Link from "next/link";

import { type Destination, DESTINATIONS } from "@/lib/festival";

import styles from "./PageNav.module.css";

/**
 * Card contents, shared by the linked and the unbuilt variants so the two can
 * never drift apart.
 */
function ScrapBody({ destination }: { destination: Destination }) {
  return (
    <>
      <span className={styles.head}>
        <span className={styles.romaji}>{destination.romaji}</span>
        {!destination.isReady && <span className={styles.badge}>準備中</span>}
      </span>
      <strong className={styles.label}>{destination.label}</strong>
      <span className={styles.blurb}>{destination.blurb}</span>
    </>
  );
}

/**
 * The six section links, laid on the wall as loose paper.
 *
 * Destinations whose page is not built yet stay in the list — visitors should
 * see what is coming — but render as a plain element rather than a link, so
 * there is nothing to click and no route to 404 into. 準備中 is real text, not
 * a styling cue, so it reaches screen readers too.
 */
export function PageNav() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>ページ一覧</h2>

        <ul className={styles.grid}>
          {DESTINATIONS.map((destination) => (
            <li key={destination.href}>
              {destination.isReady ? (
                <Link className={styles.scrap} href={destination.href}>
                  <ScrapBody destination={destination} />
                </Link>
              ) : (
                <div className={`${styles.scrap} ${styles.pending}`}>
                  <ScrapBody destination={destination} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
