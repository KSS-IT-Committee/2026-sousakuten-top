/* Information about the event */
export const FESTIVAL_NUMBER = 94;
export const FESTIVAL_THEME = "正解なんて創ればいい";

export const FESTIVAL_START = new Date("2026-09-12T08:25:00+09:00");

/* The close of the second day. Derived from the same unconfirmed schedule as
 * FESTIVAL_HOURS below, so update both together. Anything that needs to know
 * whether the festival is over reads this rather than assuming FESTIVAL_START
 * having passed means it is still running. */
export const FESTIVAL_END = new Date("2026-09-13T15:20:00+09:00");

export const FESTIVAL_DATE_LABEL = "2026年9月12日（土）・13日（日）";
export const FESTIVAL_DATE_LABEL_EN = "2026.09.12 SAT — 09.13 SUN";

/* TODO: Change to match this year's schedule(this is copied from 93th Sousakuten) */
export const FESTIVAL_HOURS = {
  morning: "8:25 — 11:30",
  afternoon: "12:10 — 15:20",
} as const;

export const VENUE_NAME = "東京都立小石川中等教育学校";
export const VENUE_ADDRESS = "東京都文京区本駒込2-29-29";
export const VENUE_ACCESS = "都営三田線「千石」駅 徒歩3分";
export const ADMISSION = "抽選申込制（校外の方）";

export type Destination = {
  readonly label: string;
  readonly romaji: string;
  readonly href: string;
  readonly blurb: string;
  readonly isReady: boolean;
};

export const DESTINATIONS: readonly Destination[] = [
  {
    label: "創作展について",
    romaji: "About",
    href: "/about",
    blurb: "創作展の歴史や、今年のテーマに込めた意味",
    isReady: false,
  },
  {
    label: "展示紹介",
    romaji: "Exhibits",
    href: "/exhibits",
    blurb: "各クラス・部活・委員会の展示を一覧",
    isReady: false,
  },
  {
    label: "タイムテーブル",
    romaji: "Schedule",
    href: "/schedule",
    blurb: "公演・発表の時間割",
    isReady: false,
  },
  {
    label: "抽選状況",
    romaji: "Lottery",
    href: "/lottery",
    blurb: "劇観覧のための抽選状況について",
    isReady: false,
  },
  {
    label: "来場案内",
    romaji: "Access",
    href: "/access",
    blurb: "アクセス方法、校内フロアマップ、持ち物・注意事項",
    isReady: false,
  },
  {
    label: "投票",
    romaji: "Vote",
    href: "/vote",
    blurb: "投票",
    isReady: false,
  },
];

export function destinationFor(href: string): Destination {
  const destination = DESTINATIONS.find((entry) => entry.href === href);
  if (!destination) {
    throw new Error(`No destination registered for "${href}" in DESTINATIONS.`);
  }
  return destination;
}
