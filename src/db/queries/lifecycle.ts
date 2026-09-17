import "server-only";

import { and, eq, isNotNull, lte } from "drizzle-orm";

import { db } from "@/db";
import { matchContenders, matches } from "@/db/schema";

/**
 * Moves every due match to its next state.
 *
 * Vercel's Hobby plan allows one cron run per day, which would leave a
 * finished match showing "LIVE" for up to 24 hours. So the app settles
 * lazily instead: any request that reads matches sweeps the due ones first,
 * and the daily cron is only a backstop for matches nobody visits.
 *
 * Both sweeps are driven by the partial index on (status, ends_at), so the
 * cost stays flat as the archive grows.
 */
export async function settleDueMatches(now = new Date()) {
  const started = await db
    .update(matches)
    .set({ status: "live", updatedAt: now })
    .where(
      and(
        eq(matches.status, "scheduled"),
        isNotNull(matches.startsAt),
        lte(matches.startsAt, now),
      ),
    )
    .returning({ id: matches.id });

  const expired = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(eq(matches.status, "live"), isNotNull(matches.endsAt), lte(matches.endsAt, now)),
    );

  for (const match of expired) {
    await settleMatch(match.id, "time", now);
  }

  return { started: started.length, settled: expired.length };
}

/**
 * Throttled wrapper for the read path.
 *
 * Without this every page view would run the sweep, turning a read-heavy site
 * into a write-heavy one. Once per instance per interval is enough to keep
 * what people see correct, because the window is far shorter than anyone
 * would notice.
 */
const SWEEP_INTERVAL_MS = 20_000;
let lastSweep = 0;
let inFlight: Promise<unknown> | null = null;

export async function sweepIfStale() {
  const now = Date.now();
  if (inFlight || now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  // A failed sweep must never break the page that triggered it — the next
  // request retries, and the cron catches anything persistently stuck.
  inFlight = settleDueMatches()
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  await inFlight;
}

/**
 * Closes a match and records who won. Contenders belong to a single match, so
 * there are no lifetime records to update — the result lives on the match.
 */
export async function settleMatch(
  matchId: string,
  decidedBy: "time" | "creator",
  now = new Date(),
) {
  const sides = await db
    .select({ id: matchContenders.id, voteCount: matchContenders.voteCount })
    .from(matchContenders)
    .where(eq(matchContenders.matchId, matchId));

  const [a, b] = sides;
  if (!a || !b) return;

  // A draw has no winner rather than an arbitrary one.
  const winner =
    a.voteCount === b.voteCount ? null : a.voteCount > b.voteCount ? a : b;

  await db
    .update(matches)
    .set({
      status: "ended",
      endedAt: now,
      decidedBy,
      winnerMatchContenderId: winner?.id ?? null,
      updatedAt: now,
    })
    .where(eq(matches.id, matchId));
}
