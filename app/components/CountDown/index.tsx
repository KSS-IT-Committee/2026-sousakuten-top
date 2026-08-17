"use client";

import { useEffect, useState } from "react";

import { FESTIVAL_END, FESTIVAL_START } from "@/lib/festival";

import styles from "./countdown.module.css";

type CountDownState =
  | { status: "pending" }
  | {
      status: "running";
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    }
  | { status: "ongoing" }
  | { status: "ended" };

function Measure(start: Date, end: Date, now: number): CountDownState {
  const diff = start.getTime() - now;
  if (diff <= 0) {
    return now < end.getTime() ? { status: "ongoing" } : { status: "ended" };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { status: "running", days, hours, minutes, seconds };
}

export function CountDown() {
  const [state, setState] = useState<CountDownState>({ status: "pending" });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    function update(): CountDownState {
      const next = Measure(FESTIVAL_START, FESTIVAL_END, Date.now());
      setState(next);
      return next;
    }

    const isEnded = update().status === "ended";
    if (!isEnded) {
      intervalId = setInterval(() => {
        if (update().status === "ended" && intervalId !== undefined) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
      }, 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (state.status === "ongoing") {
    return (
      <div>
        <span className={styles.clock}>開催中</span>
      </div>
    );
  }

  if (state.status === "ended") {
    return (
      <div>
        <span className={styles.clock}>閉幕しました</span>
      </div>
    );
  }
  const isPending = state.status === "pending";

  return (
    <div>
      <span className={styles.label}>開催まで</span>
      <p className={styles.clock}>
        <span className={styles.value}>{isPending ? "--" : state.days}</span>
        <span className={styles.unit}>日</span>
        <span className={styles.value}>
          {isPending ? "--" : String(state.hours).padStart(2, "0")}
        </span>
        <span className={styles.unit}>時間</span>
        <span className={styles.value}>
          {isPending ? "--" : String(state.minutes).padStart(2, "0")}
        </span>
        <span className={styles.unit}>分</span>
      </p>
    </div>
  );
}
