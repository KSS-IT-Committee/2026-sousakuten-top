import type { Metadata } from "next";

import { VENUE_NAME } from "@/lib/festival";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

import { CountDown } from "./components/CountDown";
import { Hero } from "./components/Hero";
import { PageNav } from "./components/PageNav";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} | ${VENUE_NAME}`,
  isTitleAbsolute: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Toppage() {
  return (
    <>
      <Hero />
      {/* <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.lead}>
            このページは準備中です。公開までしばらくお待ちください。
          </p>
        </header>
        <nav className={styles.links}>
          <Link className={styles.link} href="/changelog">
            更新履歴
          </Link>
          <Link className={styles.link} href="/requests">
            ページ改善の提案
          </Link>
        </nav>
        <CountDown />
      </div> */}
      <div className={styles.container}>
        <CountDown />
      </div>
      <PageNav />
    </>
  );
}
