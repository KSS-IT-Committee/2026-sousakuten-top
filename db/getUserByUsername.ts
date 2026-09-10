import { eq } from "drizzle-orm";

import { users } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Whether an account exists. `sousakuten_stamps.username` is a foreign key, so
 * inserting an unknown name would fail anyway — but as a raw constraint
 * violation, which the scanner cannot turn into anything more useful than
 * "something went wrong". Checking first buys a real message at the desk.
 */
export async function userExists(username: string): Promise<boolean> {
  const [row] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, username));

  return row !== undefined;
}
