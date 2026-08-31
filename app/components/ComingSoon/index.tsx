import Link from "next/link";

import { CountDown } from "@/app/components/CountDown";
import { FloatingMenu } from "@/app/components/FloatingMenu";
import type { Destination } from "@/lib/festival";

import styles from "./ComingSoon.module.css";

type ComingSoonProps = {
  destination: Destination;
};

/**
 * Placeholder for a page that the top page already links to but that has not
 * been built yet.
 *
 * It leads with the destination's own name and blurb rather than a generic
 * "coming soon", so someone who followed a link can tell they arrived at the
 * right place and simply arrived early. That is also what separates this from
 * app/not-found.tsx, which tells the visitor they are somewhere that does not
 * exist — the distinction matters, because these routes will exist.
 */
export function ComingSoon({ destination }: ComingSoonProps) {
  return (
    <>
      <div className={styles.wall}>
        <article className={styles.sheet}>
          <p className={styles.romaji}>{destination.romaji}</p>
          <h1 className={styles.title}>{destination.label}</h1>
          <p className={styles.blurb}>{destination.blurb}</p>

          <hr className={styles.rule} />

          <p className={styles.notice}>
            このページは準備中です。
            <br />
            公開まで、もうしばらくお待ちください。
          </p>

          <div className={styles.clock}>
            <CountDown />
          </div>

          <Link className={styles.back} href="/">
            トップへ戻る
          </Link>
        </article>
      </div>
      <FloatingMenu items={[{ label: "Top", href: "/" }]} />
    </>
  );
}
