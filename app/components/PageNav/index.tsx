import Link from "next/link";

import { DESTINATIONS } from "@/lib/festival";

import styles from "./PageNav.module.css";

export function PageNav() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>ページ一覧</h2>

        <ul className={styles.grid}>
          {DESTINATIONS.map((destination) => (
            <li key={destination.href}>
              <Link className={styles.scrap} href={destination.href}>
                <span className={styles.romaji}>{destination.romaji}</span>
                <strong className={styles.label}>{destination.label}</strong>
                <span className={styles.blurb}>{destination.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
