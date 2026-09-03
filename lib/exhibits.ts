export const enum ORG_TYPE {
  club,
  class,
  committee,
  other,
}

export interface Department {
  name: string;
  romaji: string;
  type: ORG_TYPE;
  description?: string;
}

export interface RubyText {
  text: string;
  ruby: string;
}

export interface Performance {
  name: string;
  title: string;
  location: string;
  date?: string;
  description?: string;
  RubyText?: RubyText;
}

export const RISSI: Department = {
  name: "立志部門",
  romaji: "RISSI",
  type: ORG_TYPE.class,
};

export const KAITAKU: Department = {
  name: "開拓部門",
  romaji: "KAITAKU",
  type: ORG_TYPE.class,
};

export const SOUSAKU: Department = {
  name: "創作部門",
  romaji: "SOUSAKU",
  type: ORG_TYPE.class,
};

export const CLUB: Department = {
  name: "部活動",
  romaji: "CLUB",
  type: ORG_TYPE.club,
};

export const COMMITTEE: Department = {
  name: "委員会",
  romaji: "COMMITTEE",
  type: ORG_TYPE.committee,
};

export const OTHER: Department = {
  name: "その他の展示",
  romaji: "OTHER",
  type: ORG_TYPE.other,
};
