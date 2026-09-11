import type { Metadata } from "next";

import { destinationFor } from "@/lib/festival";
import { destinationMetadata } from "@/lib/site";

const DESTINATION = destinationFor("/vote");

export const metadata: Metadata = destinationMetadata(DESTINATION);

import styles from "./vote.module.css";

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.section} ${className ?? ""}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function VotePage() {
  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ABOUT VOTE</p>
        <h1 className={styles.title}>投票について</h1>
      </header>
      <Section title="投票について">
        <p>今年はオンラインでの投票は行いません。</p>
        <p>下記の手順に従って投票してください。</p>
        <p>
          その他ご不明な点がございましたら、黒に桃色の柄が入ったポロシャツを着た運営スタッフにお声がけください。
        </p>
      </Section>
      <Section title="立志部門（1,2 年生）">
        <p>
          受付で投票用紙をお配りします（不正防止のため、紛失者は投票できません）。
          <br />
          そのクラスの展示を見た方のみ評価を記入の上、各クラス内にある投票箱にお入れください。
          <br />
          また、教室の混雑緩和のため、１年生の分を会議室横、２年生の分を２Ｂ前の階段下にそれぞれ感想の記入場所を用意しております。是非そちらもご利用下さい。
        </p>
      </Section>
      <Section title="開拓部門（3,4 年生）・創作部門（5,6 年生）">
        <p>
          投票用紙は各教室で入場時にお配りします。そのクラスの劇を見た方のみ、投票することができます。劇を見終わったらその場で評価を記入していただき、教室退場時に各教室で回収します。
        </p>
      </Section>
      <Section title=" 外装部門・光庭パネル部門">
        <p>
          受付で投票用紙をお配りし、ご来場いただいた全ての方に投票していただきます。
        </p>
        <p>
          光庭（校舎中央吹き抜け）の宣伝パネルと外装（教室前・階段の装飾）について立志部門・開拓部門・創作部門の各部門の良いと思った順に 3つ、外装・光庭パネルでそれぞれ記入をお願いします。
          <br />
          投票用紙は投票箱に入れるか、黒に桃色の柄が入ったポロシャツを着た運営スタッフにお渡し下さい。投票箱は各階 1 か所、アリーナ 1 か所、光庭 2か所に設置しております（時間帯によっては追加）。
        </p>
      </Section>
      <Section title="結果発表について">
        <p>各賞の結果は、このサイトにて順次発表します。</p>
      </Section>
    </section>
  );
}
