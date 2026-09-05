import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Health-specific deadline for the probe below. The shared pool in `lib/db.ts`
// caps concurrency but gives an individual query no execution deadline, so a
// stalled or blackholed database connection would otherwise keep this request
// — and the capacity it holds — pending indefinitely. Kept well under the 3s
// `wget -T 3` the deploy scripts poll this endpoint with, so a hung database
// surfaces as a 503 rather than as a timed-out health check.
const PROBE_TIMEOUT_MS = 2000;

// Races the probe against a timer instead of setting a `statement_timeout` on
// the client: the timeout stays scoped to this request (unrelated queries keep
// their current behavior), and it also covers a connection that never answers
// at all, which a server-side statement timeout cannot.
async function probeDatabase(): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("health probe timed out")),
      PROBE_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([db.execute(sql`select 1`), deadline]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    await probeDatabase();
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("db unreachable", { status: 503 });
  }
}
