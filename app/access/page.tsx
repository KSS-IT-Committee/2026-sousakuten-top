import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { destinationFor } from "@/lib/festival";

import styles from "./page.module.css";

const DESTINATION = destinationFor("/access");
export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

function PageBlock({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <section className={`${styles.block} ${tone ? styles.warning : ""}`}>
      <h2 className={styles.blockTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function AccessPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{DESTINATION.label}</h1>
      <p className={styles.pageDescription}>{DESTINATION.blurb}</p>
      <PageBlock title="校内フロアマップ">
        <p>受付で配付する冊子および校舎内に掲示しています。</p>
        {/* <p>
          会場内の移動にご利用ください。受付で配布する冊子にも掲載しています。
        </p> */}
        {/* <div className={styles.mapGrid}>
          {[
            ["1階", "first_floor.png"],
            ["2階", "second_floor.png"],
            ["3階", "third_floor.png"],
            ["4階", "forth_floor.png"],
          ].map(([label, fileName]) => (
            <figure className={styles.mapCard} key={fileName}>
              <figcaption>{label}</figcaption>
              <Image
                src={`/floor_map/${fileName}`}
                alt={`${label}の校内フロアマップ`}
                width={717}
                height={975}
              />
            </figure>
          ))}
        </div> */}
      </PageBlock>
      <PageBlock title="持ち物">
        <p>当日は以下のものをご持参ください。</p>
        <ul className={styles.list}>
          <li>
            上履き
            <span className={styles.alert}>※スリッパの貸出はありません。</span>
          </li>
          <li>土足を入れる袋</li>
          <li>飲みもの</li>
          <li>
            スマートフォン
            <div className={styles.alert}>
              ※投票用のアカウント情報を当日受付で配布します。このページ右上部よりログインをお願いいたします。
            </div>
          </li>
        </ul>
      </PageBlock>
      <PageBlock title="注意事項" tone="warning">
        <div className={styles.subBlock}>
          <h3>入場について</h3>
          <ul>
            <li>
              発熱等体調不良の場合
              <span className={styles.alert}>入場をお断り</span>します。
            </li>
            <li>
              小学生以下のお子様のみでの入場はできません。必ず
              <span className={styles.alert}>18歳以上の方とご同伴</span>
              ください。
            </li>
          </ul>
        </div>
        <div className={styles.subBlock}>
          <h3>校内でのお願い</h3>
          <ul>
            <li>
              熱中症予防の水分補給を除き、原則
              <span className={styles.alert}>飲食禁止</span>です。
            </li>
            <li>
              校内の自動販売機は関係者以外
              <span className={styles.alert}>使用禁止</span>です。
            </li>
            <li>
              校内は原則<span className={styles.alert}>撮影禁止</span>です。
            </li>
          </ul>
        </div>
        <p className={styles.notice}>
          校内でのご相談は「行事運営」と書かれたポロシャツを着た生徒にご相談ください。
        </p>
        <p className={styles.notice}>
          11:30〜12:10は昼休憩のため、入場できません。
        </p>
      </PageBlock>
      <PageBlock title="落とし物・迷子について">
        <ul>
          <li>落とし物は、一階多目的ホールで保管しています。</li>
          <li>
            お子様とはぐれた際にはお近くの「行事運営」と書かれたポロシャツを着た生徒や教員にお伝えください。当日に着用している衣服等や特徴等をお伺いした上で、一階多目的ホールにて待機となります。お子様側も同様の対応となりますので、予めお伝えください。
          </li>
        </ul>
      </PageBlock>
      <PageBlock title="お問い合わせ">
        <h3>東京都立小石川中等教育学校</h3>
        <div className={styles.addressInfo}>
          <p>
            <strong>住所:</strong>〒113-0021 東京都文京区本駒込2-29-29
          </p>
          <p>
            <strong>電話:</strong>03-3946-7171
          </p>
          <p>
            <strong>FAX:</strong>03-3946-7397
          </p>
          <p className={styles.notice}>
            ※電話受付時間は、平日の午前8時30分から午後5時までです。
          </p>
          <p>
            このサイトに関するお問い合わせは
            <Link style={{ textDecoration: "underline" }} href="/requests">
              こちら
            </Link>
          </p>
        </div>
      </PageBlock>
      <PageBlock title="アクセス">
        <p>ご来場の際は、公共交通機関をご利用ください。</p>
        <div className={styles.accessLead}>
          <strong>都営三田線「千石」駅</strong>
          <span>徒歩3分</span>
        </div>
        <div className={styles.accessLead}>
          <strong>山手線/都営三田線「巣鴨」駅</strong>
          <span>徒歩10分</span>
        </div>
        <div className={styles.accessLead}>
          <strong>山手線/東京メトロ南北線「駒込」駅</strong>
          <span>徒歩13分</span>
        </div>
        <Image
          src="/map.png"
          alt="アクセス地図"
          width={717}
          height={975}
          className={styles.accessMap}
        />
      </PageBlock>
    </div>
  );
}
