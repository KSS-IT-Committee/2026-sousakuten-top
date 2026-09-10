import type { Metadata } from "next";
import Link from "next/link";
import { unauthorized } from "next/navigation";

import { Stamp } from "@/app/components/Stamp";
import { getCollectedSpotIds } from "@/db/getStamps";
import { getCurrentUser } from "@/lib/session";
import { pageMetadata } from "@/lib/site";
import {
  STAMP_GROUP_LABELS,
  STAMP_GROUP_ORDER,
  STAMP_SPOTS,
  STAMP_TOTAL,
} from "@/lib/stamps";

import styles from "./stamps.module.css";

export const metadata: Metadata = pageMetadata({
  title: "スタンプラリー",
  description: "創作展スタンプラリーの台紙。集めたスタンプの一覧。",
  isIndexable: false,
});

/**
 * The rally card — all 47 exhibits, collected or not.
 *
 * Gated by hand rather than by <AuthGuard>, which is role-based and
 * deny-by-default: a card belongs to whoever is logged in, exactly like the
 * personal QR it is collected with.
 */
export default async function StampsPage() {
  const user = await getCurrentUser();
  if (!user) {
    unauthorized(); // 401 — not logged in
  }

  const collected = await getCollectedSpotIds(user.username);
  const collectedCount = STAMP_SPOTS.filter((spot) =>
    collected.has(spot.id),
  ).length;
  const percent = Math.round((collectedCount / STAMP_TOTAL) * 100);

  return (
    <div className={styles.wall}>
      <article className={styles.sheet}>
        <header className={styles.header}>
          <p className={styles.romaji}>Stamp Rally</p>
          <h1 className={styles.title}>スタンプ台紙</h1>
          <p className={styles.owner}>{user.username}</p>

          <p className={styles.count}>
            <span className={styles.countNow}>{collectedCount}</span>
            <span className={styles.countTotal}>/ {STAMP_TOTAL}</span>
          </p>
          {/* The bar repeats the number rather than replacing it: a count is
              what people compare with each other, the bar is just faster to
              read across a room. */}
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuenow={collectedCount}
            aria-valuemin={0}
            aria-valuemax={STAMP_TOTAL}
            aria-label="集めたスタンプ"
          >
            <div className={styles.barFill} style={{ width: `${percent}%` }} />
          </div>

          <p className={styles.lead}>
            展示を回ってスタンプを集めましょう。係の人にこの
            <Link className={styles.inlineLink} href="/qr">
              QRコード
            </Link>
            を見せるか、掲示された合言葉を入力すると押せます。
          </p>
        </header>

        {STAMP_GROUP_ORDER.map((group) => {
          const spots = STAMP_SPOTS.filter((spot) => spot.group === group);
          if (spots.length === 0) return null;

          return (
            <section key={group} className={styles.group}>
              <h2 className={styles.groupTitle}>
                {STAMP_GROUP_LABELS[group]}
                <span className={styles.groupCount}>
                  {spots.filter((spot) => collected.has(spot.id)).length}/
                  {spots.length}
                </span>
              </h2>

              <ul className={styles.grid}>
                {spots.map((spot) => {
                  const isCollected = collected.has(spot.id);
                  return (
                    <li key={spot.id} className={styles.cell}>
                      <Link
                        className={styles.cellLink}
                        href={`/stamps/${spot.id}`}
                      >
                        <Stamp spot={spot} isCollected={isCollected} />
                        <span className={styles.cellName}>{spot.name}</span>
                        <span className={styles.cellPlace}>
                          {spot.floor}F {spot.location}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <Link className={styles.back} href="/">
          トップへ戻る
        </Link>
      </article>
    </div>
  );
}
