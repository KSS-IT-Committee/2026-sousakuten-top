import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, unauthorized } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { pageMetadata } from "@/lib/site";
import { grantableSpots } from "@/lib/stamps";

import styles from "./scan.module.css";
import { Scanner } from "./Scanner";

export const metadata: Metadata = pageMetadata({
  title: "スタンプを押す",
  description: "係の人が来場者のQRコードを読み取ってスタンプを押すページ。",
  isIndexable: false,
});

/**
 * The booth desk: read a visitor's personal QR, press the stamp.
 *
 * Which exhibits an account may stamp comes from the roles it already holds —
 * the 1A desk wants G1 and ClassA — with clubs and committees open to any
 * logged-in account. An account that can stamp nothing gets a 403 rather than
 * an empty scanner, since there is nothing here for it to do.
 *
 * The list is computed here and passed down: the client is told which spots it
 * may offer, but the server checks again on every grant.
 */
export default async function StampScanPage() {
  const user = await getCurrentUser();
  if (!user) {
    unauthorized(); // 401 — not logged in
  }

  const spots = grantableSpots(user.roles);
  if (spots.length === 0) {
    forbidden(); // 403 — logged in, but staffs no booth
  }

  return (
    <div className={styles.wall}>
      <article className={styles.sheet}>
        <p className={styles.romaji}>Stamp Desk</p>
        <h1 className={styles.title}>スタンプを押す</h1>
        <p className={styles.lead}>
          来場者の
          <Link className={styles.link} href="/qr">
            個人QRコード
          </Link>
          を枠の中に写してください。読み取ると自動で押されます。
        </p>

        <Scanner
          spots={spots.map((spot) => ({ id: spot.id, name: spot.name }))}
        />

        <Link className={styles.back} href="/stamps">
          自分の台紙へ
        </Link>
      </article>
    </div>
  );
}
