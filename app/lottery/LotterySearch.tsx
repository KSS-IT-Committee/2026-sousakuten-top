"use client";

import { useId, useMemo, useState } from "react";

import type { LotteryEntry } from "@/lib/lottery";
import {
  findLotteryEntry,
  normalizeLotteryNumber,
  performanceById,
} from "@/lib/lottery";

import styles from "./LotterySearch.module.css";

type SearchResult =
  | { kind: "idle" }
  | { kind: "unparsed" }
  | { kind: "missing"; number: string }
  | { kind: "found"; number: string; entry: LotteryEntry };

function lookUp(query: string): SearchResult {
  if (query.trim() === "") return { kind: "idle" };

  const number = normalizeLotteryNumber(query);
  if (number === null) return { kind: "unparsed" };

  const entry = findLotteryEntry(number);
  return entry ? { kind: "found", number, entry } : { kind: "missing", number };
}

function WonResult({ entry }: { entry: LotteryEntry }) {
  return (
    <>
      <p className={styles.verdict}>
        <span className={styles.badgeWon}>当選</span>
        {entry.partySize !== null && (
          <span className={styles.party}>{entry.partySize}名</span>
        )}
      </p>
      <p className={styles.verdictNote}>
        下記の{entry.wins.length}公演にご当選されました。
      </p>
      <ul className={styles.wins}>
        {entry.wins.map((id) => {
          const performance = performanceById(id);
          return (
            <li key={id} className={styles.win}>
              <span className={styles.winDate}>{performance.dateLabel}</span>
              <span className={styles.winStage}>
                {performance.stageLabel}（{performance.timeLabel}）
              </span>
              <span className={styles.winClass}>{performance.classLabel}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ExcludedResult({ entry }: { entry: LotteryEntry }) {
  return (
    <>
      <p className={styles.verdict}>
        <span className={styles.badgeExcluded}>抽選対象外</span>
      </p>
      <p className={styles.verdictNote}>
        {entry.note === ""
          ? "この申込は抽選の対象外となりました。"
          : `この申込は抽選の対象外となりました（${entry.note}）。`}
      </p>
    </>
  );
}

/**
 * Lets a visitor look their own draw number up instead of hunting for it in
 * the 64 per-performance lists below.
 *
 * The whole dataset ships to the browser — it is the same public list the page
 * already prints — so the lookup is local and instant, with no request that
 * could tie a number to whoever typed it. Matching runs on every keystroke
 * rather than behind a submit button, but the form still submits so a phone
 * keyboard's 検索 key does the expected thing.
 */
export function LotterySearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const result = useMemo(() => lookUp(query), [query]);

  return (
    <section className={styles.search} aria-labelledby={`${inputId}-label`}>
      <form onSubmit={(event) => event.preventDefault()}>
        <label
          className={styles.label}
          id={`${inputId}-label`}
          htmlFor={inputId}
        >
          抽選番号を検索
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="search"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="0468"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <p className={styles.hint}>
        受付番号（AE00046805 など）をそのまま入力しても検索できます。
      </p>

      <output className={styles.result} aria-live="polite">
        {result.kind === "idle" && (
          <p className={styles.placeholder}>
            番号を入力すると、結果がここに表示されます。
          </p>
        )}

        {result.kind === "unparsed" && (
          <p className={styles.placeholder}>数字を入力してください。</p>
        )}

        {result.kind === "missing" && (
          <p className={styles.notFound}>
            抽選番号 <strong>{result.number}</strong>{" "}
            のお申込は見つかりませんでした。番号をお確かめのうえ、
            それでも解決しない場合は下記の問い合わせ先までご連絡ください。
          </p>
        )}

        {result.kind === "found" && (
          <div className={styles.card}>
            <p className={styles.cardNumber}>
              抽選番号 <strong>{result.number}</strong>
            </p>
            {result.entry.status === "won" ? (
              <WonResult entry={result.entry} />
            ) : (
              <ExcludedResult entry={result.entry} />
            )}
          </div>
        )}
      </output>
    </section>
  );
}
