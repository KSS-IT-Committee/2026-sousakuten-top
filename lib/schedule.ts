export const FESTIVAL_DATE = "2026/09/12 - 2026/09/13";
export const START_ENTER_TIME = "08:25";
export const FESTIVAL_HOURS = {
  AM: "08:25 - 11:30",
  PM: "12:10 - 15:20",
};
export const END_TIME = "15:20";

export const SOUSAKU_PERFORMANCE_TIME = 75;
export const SOUSAKU_PERFORMANCE = {
  1: "08:45 - 10:00",
  2: "10:20 - 11:35",
  3: "12:30 - 13:45",
  4: "14:05 - 15:20",
};

export const KAITAKU_PERFORMANCE_TIME = 30;
export const KAITAKU_PERFORMANCE = {
  1: "08:45 - 09:15",
  2: "09:30 - 10:00",
  3: "10:15 - 10:45",
  4: "11:00 - 11:30",
  5: "12:30 - 13:00",
  6: "13:15 - 13:45",
  7: "14:00 - 14:30",
  8: "14:45 - 15:15",
};

export const RISSI_PERFORMANCE = {
  AM: "09:00 - 11:25",
  PM: "12:25 - 15:30",
};

const BRASS_BAND_PERFORMANCE = {
  1: "10:55 - 11:35",
  2: "12:30 - 13:00",
  3: "14:20 - 15:00",
};

const SADOU_PERFORMANCE = {
  1: "09:00 - 09:20",
  2: "09:30 - 09:50",
  3: "10:00 - 10:20",
  4: "10:30 - 10:50",
  5: "11:00 - 11:20",
  6: "12:30 - 12:50",
  7: "13:00 - 13:20",
  8: "13:30 - 13:50",
  9: "14:00 - 14:20",
  10: "14:30 - 14:50",
};

const PHILHARMONIC_PERFORMANCE = {
  1: "09:00 - 11:20",
  2: "12:30 - 15:15",
};

const KARUTA_PERFORMANCE = {
  "模擬試合 1": "09:00 - 10:00",
  "模擬試合 2": "10:25 - 11:25",
  かるた体験: "12:30 - 15:00",
};

const QUIZ_PERFORMANCE = {
  クイズ体験: "09:00-11:30",
  ミニクイズ大会: "13:55 - 14:30",
};

const COOKING_PERFORMANCE = {
  お菓子販売: "12:45 - 14:00",
};

const CHORUS_PERFORMANCE = {
  1: "09:00 - 09:30",
  2: "13:30 - 14:00",
};

const THEATER_PERFORMANCE = {
  1: "08:55 - 09:50",
  2: "10:30 - 11:25",
  3: "12:40 - 13:35",
  4: "14:15 - 15:10",
};

const JAZZ_PERFORMANCE = {
  1: "10:30 - 11:30",
  2: "13:00 - 14:00",
};

const CHEMISTRY_PERFORMANCE = {
  1: "09:00 - 09:20",
  2: "11:00 - 11:20",
  3: "12:30 - 12:50",
  4: "13:40 - 14:00",
  5: "14:50 - 15:10",
};

export const clubPerformanceTime = {
  BRASS_BAND: [BRASS_BAND_PERFORMANCE, "09/12(土)", "剣道場"],
  SADOU: [SADOU_PERFORMANCE, "09/12(土) 09/13(日)", "茶室"],
  PHILHARMONIC: [PHILHARMONIC_PERFORMANCE, "09/13(土)", "剣道場"],
  KARUTA: [KARUTA_PERFORMANCE, "09/12(土) ", "柔道場"],
  QUIZ: [QUIZ_PERFORMANCE, "09/12(土) 09/13(日)", "視聴覚室"],
  COOKING: [COOKING_PERFORMANCE, "09/12(土) 09/13(日)", "調理室・被覆室"],
  CHORUS: [CHORUS_PERFORMANCE, "09/12(土))", "音楽室"],
  THEATER: [THEATER_PERFORMANCE, "09/12(土) 09/13(日)", "401教室"],
  JAZZ: [JAZZ_PERFORMANCE, "09/13(日)", "音楽室"],
  CHEMISTRY: [CHEMISTRY_PERFORMANCE, "09/12(土) 09/13(日)", "化学室"],
} as const;
