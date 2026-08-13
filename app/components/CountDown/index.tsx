"use client";

import { useEffect, useState } from "react";

import { FESTIVAL_START } from "@/lib/festival";

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
  | { status: "finished" };

function Measure(target: Date, now: number): CountDownState {
  const diff = target.getTime() - now;
  if (diff <= 0) {
    return { status: "finished" };
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
    function update() {
      setState(Measure(FESTIVAL_START, Date.now()));
    }

    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (state.status === "finished") {
    return (
      <div>
        <span className={styles.clock}>開催中</span>
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
