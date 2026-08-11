import Link from "next/link";

import { Footer } from "@/app/components/Footer";

import styles from "./not-found.module.css";

export default function Unauthorized() {
  return (
    <>
      <main className={styles.wrapper}>
        <h1 className={styles.code}>401</h1>
        <p className={styles.title}>ログインが必要です</p>
        <p className={styles.subtitle}>
          このページを表示するにはログインしてください
        </p>
        <div className={styles.divider} />
        <Link href="/" className={styles.homeLink}>
          トップへ戻る
        </Link>
      </main>
      <Footer />
    </>
  );
}
