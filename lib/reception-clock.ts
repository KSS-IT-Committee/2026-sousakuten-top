import "server-only";

/**
 * "Now", as the 受付締切 is judged: the server's clock. The desk phones run
 * their countdown off it too (the page hands the list its render time), so a
 * phone whose own clock is off still locks when the server starts refusing.
 *
 * In development only, LOCAL_DEV_NOW (an ISO instant such as
 * "2026-09-12T08:39:00+09:00") puts the clock at that moment when the server
 * starts, and it runs on from there — so the countdown and the lock can be
 * rehearsed before the day, the way LOCAL_DEV_USER stands in for a login.
 * Measured from the process start rather than from whenever this module
 * happens to load, so every page and action of one dev server agrees on the
 * time. Production ignores it.
 */
const CLOCK_OFFSET_MS = devClockOffsetMs();

function devClockOffsetMs(): number {
  const fakeNow = process.env.LOCAL_DEV_NOW;
  if (process.env.NODE_ENV !== "development" || !fakeNow) return 0;
  const startsAt = Date.parse(fakeNow);
  if (Number.isNaN(startsAt)) return 0;
  const processStartedAt = Date.now() - process.uptime() * 1000;
  return startsAt - processStartedAt;
}

export function receptionNow(): Date {
  return new Date(Date.now() + CLOCK_OFFSET_MS);
}
