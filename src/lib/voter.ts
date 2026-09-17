import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

import { env } from "@/env";

const COOKIE = "vs_vk";
/** A year. Long enough that dedupe survives a match; short enough to expire. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Anonymous voting means the voter key is the only thing standing between one
 * person and unlimited votes, so it is signed: an unsigned cookie could just be
 * edited to a fresh value for every vote. The HMAC means a forged key is
 * rejected and a new one issued instead of silently counting.
 */
function sign(value: string): string {
  return createHmac("sha256", env.VOTE_SECRET).update(value).digest("base64url");
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = sign(value);
  // Constant-time compare — a plain === leaks how much of the MAC matched.
  if (mac.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return value;
}

export type VoterIdentity = {
  key: string;
  /** Set when the cookie was missing or invalid and a new one was minted. */
  freshToken: string | null;
};

/** Reads the caller's voter key, minting one when absent. */
export async function getVoterIdentity(): Promise<VoterIdentity> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
    const key = verify(existing);
    if (key) return { key, freshToken: null };
  }
  const key = randomBytes(16).toString("base64url");
  return { key, freshToken: `${key}.${sign(key)}` };
}

export const VOTER_COOKIE = {
  name: COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  },
};

/**
 * Salted hashes for abuse forensics. Raw IPs are never stored — they are
 * personal data, and nothing in this product needs to reverse them.
 */
export async function requestFingerprint() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "";
  const ua = h.get("user-agent") ?? "";
  const salted = (v: string) =>
    v ? createHash("sha256").update(env.IP_HASH_SALT).update(v).digest("hex").slice(0, 32) : null;
  return { ipHash: salted(ip), uaHash: salted(ua) };
}
