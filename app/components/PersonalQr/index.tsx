import { personalCodeFor } from "@/lib/personal-code";
import { getCurrentUser } from "@/lib/session";

import { PersonalQrShell } from "./PersonalQrShell";
import { QrCode } from "./QrCode";

/**
 * The personal-QR entry point, mounted once from the root layout.
 *
 * Renders nothing at all for a logged-out visitor — external guests have no
 * account to identify, so a button leading them to a login they cannot pass
 * would be a dead end. Anyone with a session gets it, roles or not: this
 * identifies the holder, it does not grant anything, and what a scan is
 * allowed to prove is the scanner's decision to make later.
 *
 * The symbol is built here, on the server, and handed to the client shell as
 * children — so the QR generator never reaches the browser bundle and the
 * code is already in the HTML when the button is first tapped.
 *
 * Reading the session makes every route dynamic; the layout already does
 * (<AccountBar />), and getCurrentUser is React-cached per request, so this
 * adds no second lookup.
 */
export async function PersonalQr() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <PersonalQrShell username={user.username}>
      <QrCode value={personalCodeFor(user.username)} username={user.username} />
    </PersonalQrShell>
  );
}
