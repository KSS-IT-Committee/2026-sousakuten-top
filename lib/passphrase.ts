import "server-only";

import { randomInt } from "node:crypto";

/**
 * The booth passphrase: the self-serve half of the stamp rally, for exhibits
 * with nobody free to scan.
 *
 * It is written on the poster beside the booth's QR, so it is not secret from
 * anyone standing there — what it proves is presence. That framing drives
 * every choice below: it has to survive being read off a printed sheet and
 * typed on a phone in a crowded corridor, and it has to be cheap to rotate
 * when a photo of the poster inevitably ends up in a group chat.
 */

/**
 * Unambiguous uppercase alphabet — no I/O/0/1, which are the pairs people
 * actually confuse when copying from print. Same reasoning (and nearly the
 * same set) as 2026-account-generator's password alphabet.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 32^6 ≈ 1.07e9 — far past guessing, given the attempt limit on top. */
const LENGTH = 6;

export function generatePassphrase(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    // randomInt is the CSPRNG; Math.random would make the whole sheet
    // predictable from a couple of leaked passphrases.
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/**
 * Folds what someone actually typed onto the canonical form: full-width
 * characters (a Japanese IME left in 全角 is the likeliest way to mistype
 * this), stray spaces from a copy-paste, and lower case.
 */
export function normalizePassphrase(input: string): string {
  return input
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/\s+/g, "")
    .toUpperCase();
}
