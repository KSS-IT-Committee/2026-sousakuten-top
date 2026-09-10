import type { Metadata } from "next";
import Link from "next/link";

import { AuthGuard } from "@/app/components/AuthGuard";
import { getAllStampPassphrases } from "@/db/getStampPassphrases";
import { pageMetadata } from "@/lib/site";
import { SITE_URL } from "@/lib/site";
import {
  STAMP_GROUP_LABELS,
  STAMP_GROUP_ORDER,
  STAMP_PASSPHRASE_ROLES,
  STAMP_SPOTS,
} from "@/lib/stamps";

import {
  generateMissingPassphrasesAction,
  rotatePassphraseAction,
} from "./action";
import styles from "./passphrases.module.css";

export const metadata: Metadata = pageMetadata({
  title: "スタンプ合言葉の管理",
  description: "各展示のスタンプ合言葉の一覧と再生成。",
  isIndexable: false,
});

/**
 * The committee's printing sheet: every booth, its poster URL and its
 * passphrase, ready to be copied onto the posters that go up beside each
 * exhibit.
 *
 * Everything on this page is what a visitor at that booth can already read, so
 * the sensitivity is low — but seen all at once it is the whole rally, which
 * is why it is behind a committee role rather than open to any account.
 */
export default function PassphrasesPage() {
  return (
    <AuthGuard role={STAMP_PASSPHRASE_ROLES}>
      <PassphraseSheet />
    </AuthGuard>
  );
}

async function PassphraseSheet() {
  const rows = await getAllStampPassphrases();
  const bySpot = new Map(rows.map((row) => [row.spotId, row.passphrase]));
  const missing = STAMP_SPOTS.filter((spot) => !bySpot.has(spot.id)).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>スタンプ合言葉</h1>
        <p className={styles.lead}>
          掲示用のURLと合言葉の一覧です。QRコードにはURLを、その横に合言葉を印刷してください。
          再生成すると、その展示の古い掲示は使えなくなります。
        </p>
        <p className={styles.status}>
          未生成: <strong>{missing}</strong> / {STAMP_SPOTS.length}
        </p>
        <form action={generateMissingPassphrasesAction}>
          <button
            type="submit"
            className={styles.bulk}
            disabled={missing === 0}
          >
            未生成の展示にまとめて生成
          </button>
        </form>
      </header>

      {STAMP_GROUP_ORDER.map((group) => {
        const spots = STAMP_SPOTS.filter((spot) => spot.group === group);
        if (spots.length === 0) return null;

        return (
          <section key={group} className={styles.group}>
            <h2 className={styles.groupTitle}>{STAMP_GROUP_LABELS[group]}</h2>
            <ul className={styles.list}>
              {spots.map((spot) => {
                const passphrase = bySpot.get(spot.id);
                return (
                  <li key={spot.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.spotName}>{spot.name}</span>
                      <span className={styles.url}>
                        {SITE_URL}/stamps/{spot.id}
                      </span>
                    </div>
                    <code
                      className={
                        passphrase ? styles.passphrase : styles.passphraseNone
                      }
                    >
                      {passphrase ?? "未生成"}
                    </code>
                    <form action={rotatePassphraseAction}>
                      <input type="hidden" name="spotId" value={spot.id} />
                      <button type="submit" className={styles.rotate}>
                        {passphrase ? "再生成" : "生成"}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <Link className={styles.back} href="/stamps">
        台紙へ
      </Link>
    </div>
  );
}
