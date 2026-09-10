import { Metadata } from "next";
import Image from "next/image";

import { AuthGuard } from "@/app/components/AuthGuard";
import { getLostItems } from "@/db/getLostItems";
import { IMAGE_URL_PREFIX } from "@/lib/lost-items";
import { LOST_ITEM_ADMIN_ROLES } from "@/lib/lost-items-access";

import styles from "./edit.module.css";
import LostItemEditPopup from "./popup";

export const metadata: Metadata = {
  title: "忘れ物の追加",
  description: "忘れ物追加・編集ページ",
};

export default async function LostItemsEditPage() {
  const lostItems = await getLostItems();
  return (
    <>
      <AuthGuard role={LOST_ITEM_ADMIN_ROLES}>
        <div className={styles.main}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>LOST ITEMS EDIT</p>
            <h1 className={styles.title}>忘れ物追加</h1>
            <p className={styles.lead}>
              忘れ物を追加・編集できます。追加した写真と説明は、そのまま公開の忘れ物ページに並びます。持ち主が見つかったものは削除してください。
            </p>
          </header>
          <LostItemEditPopup />
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
      </AuthGuard>
    </>
  );
}
