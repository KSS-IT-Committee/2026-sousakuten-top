import { Metadata } from "next";
import Image from "next/image";

import { getLostItems } from "@/db/getLostItems";
import { IMAGE_URL_PREFIX } from "@/lib/lost-items";

import styles from "./lost_items.module.css";

export const metadata: Metadata = {
  title: "忘れ物",
  description: "忘れ物一覧",
};

export default async function LostItemsPage() {
  const lostItems = await getLostItems();
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

        {lostItems.length === 0 ? (
          <p className={styles.noItems}>現在、忘れ物はありません。</p>
        ) : (
          <ul className={styles.grid}>
            {lostItems.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.frame}>
                  <Image
                    src={`${IMAGE_URL_PREFIX}${item.fileName}`}
                    alt={item.description ?? "忘れ物の写真"}
                    fill
                    sizes="(max-width: 640px) 50vw, 240px"
                    className={styles.image}
                  />
                </div>
                {item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
