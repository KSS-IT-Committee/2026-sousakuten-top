import type { Metadata } from "next";
import Link from "next/link";

import { CountDown } from "./components/CountDown";
import { Hero } from "./components/Hero";
import { PageNav } from "./components/PageNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "創作展2026",
  description: "東京都立小石川中等教育学校 創作展2026 トップページ",
};

export default function Toppage() {
  return (
    <>
      <Hero />
      <div className={styles.container}>
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
      </div>
      <PageNav />
    </>
  );
}
