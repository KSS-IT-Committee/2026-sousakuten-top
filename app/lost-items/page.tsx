import { Metadata } from "next";

import styles from "./lost_items.module.css";

const metadata: Metadata = {
  title: "忘れ物 | 創作展2026",
  description: "忘れ物一覧",
};

export default function LostItemsPage() {
  return (
    <>
      <div className={styles.main}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>LOST ITEMS</p>
          <h1 className={styles.title}>忘れ物一覧</h1>
          <p className={styles.lead}>
            創作展期間中に会場内で見つかった忘れ物の一覧です。お心当たりのある方はお問い合わせください。
          </p>
        </header>
      </div>
    </>
  );
}
