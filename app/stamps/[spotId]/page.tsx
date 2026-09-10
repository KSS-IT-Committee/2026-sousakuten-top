import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unauthorized } from "next/navigation";

import { Stamp } from "@/app/components/Stamp";
import { getStampPassphrase } from "@/db/getStampPassphrases";
import { getCollectedSpotIds } from "@/db/getStamps";
import { getCurrentUser } from "@/lib/session";
import { pageMetadata } from "@/lib/site";
import { STAMP_GROUP_LABELS, stampSpotById } from "@/lib/stamps";

import { ClaimForm } from "./ClaimForm";
import styles from "./spot.module.css";

type PageProps = { params: Promise<{ spotId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { spotId } = await params;
  const spot = stampSpotById(spotId);
  return pageMetadata({
    title: spot ? `${spot.name} のスタンプ` : "スタンプ",
    description: "創作展スタンプラリーのスタンプ取得ページ。",
    isIndexable: false,
  });
}

/**
 * One booth's stamp page — what the QR poster beside the exhibit points at.
 *
 * The URL carries no secret, so the poster's QR is safe to print and works
 * with any phone's camera app. The passphrase written next to it is what
 * proves the visitor is actually standing there.
 */
export default async function StampSpotPage({ params }: PageProps) {
  const { spotId } = await params;
  const spot = stampSpotById(spotId);
  if (!spot) notFound();

  const user = await getCurrentUser();
  if (!user) {
    unauthorized(); // 401 — a stamp has to belong to somebody
  }

  const [collected, passphrase] = await Promise.all([
    getCollectedSpotIds(user.username),
    getStampPassphrase(spot.id),
  ]);
  const isCollected = collected.has(spot.id);

  return (
    <div className={styles.wall}>
      <article className={styles.sheet}>
        <p className={styles.romaji}>{STAMP_GROUP_LABELS[spot.group]}</p>
        <h1 className={styles.title}>{spot.name}</h1>
        {spot.title && <p className={styles.subtitle}>{spot.title}</p>}
        <p className={styles.place}>
          {spot.floor}F {spot.location}
        </p>

        <div className={styles.stamp}>
          <Stamp spot={spot} isCollected={isCollected} />
        </div>

        {isCollected ? (
          <p className={styles.done}>このスタンプは取得済みです。</p>
        ) : passphrase === null ? (
          // No passphrase generated: this booth is staffed-scan only. Said
          // plainly here so a visitor is not left typing into a dead box.
          <p className={styles.done}>
            この展示は合言葉での取得に対応していません。
            <br />
            係の人にQRコードを見せてください。
          </p>
        ) : (
          <ClaimForm spotId={spot.id} />
        )}

        <div className={styles.links}>
          <Link className={styles.link} href="/stamps">
            台紙へ
          </Link>
          <Link className={styles.link} href="/qr">
            QRコード
          </Link>
        </div>
      </article>
    </div>
  );
}
