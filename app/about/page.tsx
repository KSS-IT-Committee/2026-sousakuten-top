import type { Metadata } from "next";
import Link from "next/link";

import { destinationFor } from "@/lib/festival";

import styles from "./about.module.css";

const DESTINATION = destinationFor("/about");

export const metadata: Metadata = {
  title: `${DESTINATION.label} | 創作展2026`,
  description: DESTINATION.blurb,
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <article className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>ABOUT SOUSAKUTEN</p>
        <h1 className={styles.title}>創作展とは</h1>
        <p className={styles.lead}>
          みんなで創り、みんなで楽しむ。創作展は、参加する一人ひとりの想いが集まって生まれる場所です。
        </p>
      </header>

      <section className={styles.section}>
        <p>
          創作展の目的は、創作展に参加する全ての団体が団結して一つのものを作り上げることを通じて、来場者の方を楽しませることです。
          また、参加する全ての人にとって思い出に残る創作展にすることです。
        </p>
      </section>
      <Section title="創作展の歴史">
        <p>
          創作展は、東京都立小石川中等教育学校の「行事週間」の一環として開催される、一般的な文化祭におけるクラス発表・部活発表を行う伝統的な行事です。毎年、外部からも多くの来校者が訪れる、学校を代表する行事となっています。
          創作展の歴史は、およそ100年以上前にさかのぼります。
        </p>
        <p>
          1921年、東京府立第五中学校（現在の東京都立小石川中等教育学校）では初代校長・伊藤長七のもと、生徒たちの創作や研究の成果を発表する「創作展覧会」が開催され、3000人以上の来場が記録されました。
          この創作展覧会は、「日本で最も古い文化祭」とも言われており、長い歴史を持ちながらも様々な変遷を経て変わり続けています。
        </p>
        <p>
          クラス発表では、教室とは思えない本格的な舞台が完成し、各クラスによる劇が披露されます。特に6年生は、来校者や生徒による投票で決まる「創作展大賞」を目指し、1年前から準備を進めます。
          過去の創作展の様子は学校HPからご覧になることができます。
        </p>
      </Section>
      <Section title="行事週間について">
        「行事週間」という名は小石川独自のものです。
        1週間で三大行事（芸能祭・体育祭・創作展）を連続して行うことから、小石川高校の生徒によって名付けられました。
        生徒自治の一環として、企画・運営はすべて生徒によって行われており、試行錯誤をしながらも主体的に活動することで得られる達成感と経験は、学校生活を支える基盤となっています。
      </Section>
      <Section title="第94回創作展テーマ">
        <blockquote className={styles.theme}>
          <span>正解なんて創ればいい</span>
        </blockquote>
        <div className={styles.copy}>
          <p>突然ですが、みなさんにとっての正解とはなんでしょうか。</p>
          <p>
            創作展で失敗しないこと、周りの人と仲良くやること、はたまた創作展大賞を取ることなど、色々な正解があると思います。
            でも創作展はもっと自由なものです。
          </p>
          <p>
            失敗してしまうことだってある。初めて挑戦することだってあってもいい。そんな全ての行動と決断の結果が、皆さんの「正解」になると思います。
          </p>
          <p>
            今この場所、この瞬間、このメンバーでしか創れない創作展がきっとあります。皆さんの正解で、全ての人に魅せてください。
          </p>
        </div>
        <p className={styles.signature}>創作展委員会</p>
      </Section>
      <Section title="出演団体">
        創作展では、以下の通り1～6年生の各クラスと部活動団体が出展を行います。
        <ul>
          <li>
            <strong>立志部門</strong>：1年生・2年生
          </li>
          <li>
            <strong>開拓部門</strong>：3年生・4年生
          </li>
          <li>
            <strong>創作部門</strong>：5年生・6年生
          </li>
          <li>
            <strong>理数系部活動団体</strong>
          </li>
          <li>
            <strong>音楽系部活動団体</strong>
          </li>
          <li>
            <strong>その他の部活動団体</strong>
          </li>
        </ul>
        <p>
          クラス団体は学年によって立志、開拓、創作の3つの部門に分かれており、立志部門は展示、開拓・創作部門は演劇を行います。教室前の外装や階段装飾、光庭に展示する光庭パネルなどの制作にも力を入れています。
        </p>
        <p>以下のリンクから出展団体を紹介しています。ぜひご覧ください。</p>
        <div className={styles.linkRow}>
          <Link className={styles.linkButton} href="/exhibits">
            出展団体一覧
          </Link>
        </div>
        <div className={styles.linkGroup}>
          また、創作部門の観覧は事前抽選制です。
          <p>抽選結果は以下のリンクからご確認ください。</p>
          <div className={styles.linkRow}>
            <Link className={styles.linkButton} href="/lottery">
              抽選結果確認
            </Link>
          </div>
        </div>
      </Section>
      <Section title="投票・大賞について">
        創作展では、生徒や来校者による投票を行い、以下の賞を決定します。
        <ul>
          <li>
            <strong>立志部門</strong> ：1位（立志大賞）・2位・3位
          </li>
          <li>
            <strong>開拓部門</strong> ：1位（開拓大賞）・2位・3位
          </li>
          <li>
            <strong>創作部門</strong> ：1位（創作大賞）・2位・3位
          </li>
          <li>
            <strong>光庭パネル部門</strong>：1位・2位・3位
          </li>
          <li>
            <strong>外装・立志部門</strong>：1位・2位・3位
          </li>
          <li>
            <strong>外装・開拓部門</strong>：1位・2位・3位
          </li>
          <li>
            <strong>外装・創作部門</strong>：1位・2位・3位
          </li>
        </ul>
        <p>
          詳しい投票方法は
          <Link href="/vote">こちら</Link>
          をご覧ください。
        </p>
        <p>投票の結果は後日発表いたします。</p>
      </Section>
    </article>
  );
}
