#!/usr/bin/env node
// Converts the private lottery draw output into the public dataset the
// /lottery page reads.
//
//   node scripts/build-lottery-results.mjs [path/to/external-results.csv]
//
// The source CSV lives in the PRIVATE 2026-lottery repo
// (out/external-results.csv) and carries applicant names and e-mail
// addresses. This repository is public, so the CSV must never be committed
// here; run this script against a local checkout of 2026-lottery instead and
// commit only the JSON it writes.
//
// The two personal columns (氏名 / メールアドレス) are dropped on the way
// through: nothing but the applicant's own 抽選番号 — the pseudonymous draw
// number printed on their confirmation mail — reaches the artifact. That
// number is what the announcement is for, so it is published on purpose.
//
// Regenerate (from this repo's root) with:
//   node scripts/build-lottery-results.mjs ../2026-lottery/out/external-results.csv

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SOURCE = join(
  repoRoot,
  "..",
  "2026-lottery",
  "out",
  "external-results.csv",
);
const OUT_FILE = join(repoRoot, "content", "lottery", "results.json");

// Columns that must never reach the artifact, checked by name so a reshaped
// source CSV cannot smuggle them through a positional read.
const PERSONAL_COLUMNS = ["氏名", "メールアドレス"];

const STAGE_NUMBERS = new Map([
  ["第一公演", 1],
  ["第二公演", 2],
  ["第三公演", 3],
  ["第四公演", 4],
]);

// "9月12日（土）第一公演（8:45～10:00） 5年A組"
const PERFORMANCE_PATTERN =
  /^(\d+)月(\d+)日（(.)）(第[一二三四]公演)（(.+?)）\s+(\d)年([A-D])組$/;

const log = (msg) => console.log(`[lottery] ${msg}`);

/** Minimal RFC 4180 reader: quoted fields, "" escapes, CRLF or LF rows. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let isQuoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (isQuoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          isQuoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      isQuoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // A trailing newline leaves one empty row behind; drop blank rows outright.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function toRecords(text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const header = rows.shift();
  if (!header) throw new Error("source CSV is empty");
  return rows.map((cells) =>
    Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])),
  );
}

/**
 * Turns a draw label into a stable performance record. The id is ASCII so it
 * survives URLs and React keys: "0912-1-5A".
 */
function parsePerformance(label) {
  const match = PERFORMANCE_PATTERN.exec(label.trim());
  if (!match) throw new Error(`unparseable performance label: "${label}"`);

  const [, month, day, weekday, stage, time, grade, classLetter] = match;
  const stageNumber = STAGE_NUMBERS.get(stage);
  if (stageNumber === undefined) throw new Error(`unknown stage: "${stage}"`);

  const monthPadded = month.padStart(2, "0");
  const dayPadded = day.padStart(2, "0");

  return {
    id: `${monthPadded}${dayPadded}-${stageNumber}-${grade}${classLetter}`,
    date: `${monthPadded}${dayPadded}`,
    dateLabel: `${month}月${day}日（${weekday}）`,
    stageNumber,
    stageLabel: stage,
    timeLabel: time,
    classId: `${grade}${classLetter}`,
    classLabel: `${grade}年${classLetter}組`,
  };
}

const sourcePath = process.argv[2] ?? DEFAULT_SOURCE;
const records = toRecords(readFileSync(sourcePath, "utf8"));
if (records.length === 0) throw new Error(`no rows in ${sourcePath}`);

for (const column of PERSONAL_COLUMNS) {
  if (!(column in records[0])) {
    throw new Error(
      `source CSV has no "${column}" column — the layout changed, so the ` +
        `columns this script drops can no longer be trusted; re-check it ` +
        `before regenerating.`,
    );
  }
}

const performances = new Map();

function performanceIdFor(label) {
  const performance = parsePerformance(label);
  if (!performances.has(performance.id)) {
    performances.set(performance.id, performance);
  }
  return performance.id;
}

const entries = records.map((record) => {
  const number = record["抽選番号"].trim();
  if (!/^\d{4}$/.test(number)) {
    throw new Error(`unexpected 抽選番号: "${number}"`);
  }

  const wins = ["当選公演1", "当選公演2", "当選公演3"]
    .map((column) => record[column].trim())
    .filter((label) => label !== "")
    .map(performanceIdFor);

  const result = record["結果"].trim();
  const isWinner = result === "当選";
  if (!isWinner && result !== "対象外") {
    throw new Error(`unexpected 結果 for ${number}: "${result}"`);
  }
  if (isWinner && wins.length === 0) {
    throw new Error(`${number} is marked 当選 but won no performance`);
  }

  // "2名" → 2. Blank for the 対象外 rows, which were withdrawn or invalid
  // before the draw and so never had a party size to honour.
  const partySizeMatch = /^(\d+)名$/.exec(record["観覧人数"].trim());

  return {
    number,
    status: isWinner ? "won" : "excluded",
    partySize: partySizeMatch ? Number(partySizeMatch[1]) : null,
    wins,
    note: record["備考"].trim(),
  };
});

const numbers = new Set(entries.map((entry) => entry.number));
if (numbers.size !== entries.length) {
  throw new Error("duplicate 抽選番号 in source CSV");
}

entries.sort((a, b) => a.number.localeCompare(b.number));

const sortedPerformances = [...performances.values()].sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.stageNumber - b.stageNumber ||
    a.classId.localeCompare(b.classId),
);

const artifact = {
  performances: sortedPerformances,
  entries,
};

// Run the artifact through Prettier so it survives `npm run format:check`
// exactly as written; JSON.stringify alone keeps short arrays expanded, which
// Prettier would collapse.
const serialized = await format(JSON.stringify(artifact), {
  ...(await resolveConfig(OUT_FILE)),
  filepath: OUT_FILE,
});
for (const column of PERSONAL_COLUMNS) {
  if (serialized.includes(column)) {
    throw new Error(`"${column}" leaked into the artifact; refusing to write`);
  }
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, serialized);
log(
  `wrote ${entries.length} entries across ${sortedPerformances.length} ` +
    `performances to ${OUT_FILE}`,
);
