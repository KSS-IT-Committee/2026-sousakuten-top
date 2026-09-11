import type { Metadata } from "next";
import { unauthorized } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { pageMetadata } from "@/lib/site";

// Never indexable: the page is per-account and exists only for the person
// holding it. It is left out of app/sitemap.ts for the same reason.
export const metadata: Metadata = pageMetadata({
  title: "個人QRコード",
  description: "ログイン中のアカウントの個人QRコード。",
  isIndexable: false,
});

/**
 * The full-page personal QR code.
 *
 * <PersonalQrShell> normally shows this same symbol in a dialog without ever
 * navigating; this route is what the button degrades to without JavaScript,
 * what a bookmark or a home-screen shortcut points at, and where someone
 * lands who was sent the link.
 *
 * Gated by hand rather than by <AuthGuard>, which is role-based and
 * deny-by-default: a personal code identifies whoever is logged in and grants
 * nothing on its own, so every session may see its own — including accounts
 * that hold no roles yet.
 */
export default async function QrPage() {
  const user = await getCurrentUser();
  if (!user) {
    unauthorized(); // 401 — not logged in
  }

  return (
    <>
      {/* <div className={styles.wall}>
        <article className={styles.sheet}>
          <p className={styles.romaji}>My Code</p>
          <h1 className={styles.title}>個人QRコード</h1>
          <p className={styles.lead}>
            受付でこの画面を提示してください。
            <br />
            アカウントごとに異なるコードです。
          </p>

          <div className={styles.card}>
            <QrCode
              value={personalCodeFor(user.username)}
              username={user.username}
            />
          </div>

          <p className={styles.username}>{user.username}</p>
          <p className={styles.hint}>
            読み取れないときは、画面の明るさを上げてください。
          </p>

          <Link className={styles.back} href="/">
            トップへ戻る
          </Link>
        </article>
      </div>
      <FloatingMenu items={[{ label: "Top", href: "/" }]} /> */}
    </>
  );
}
