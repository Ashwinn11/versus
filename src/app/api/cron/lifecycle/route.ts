import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { contenders, matchContenders, matches } from "@/db/schema";
import { env } from "@/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Moves matches through their lifecycle and settles finished ones.
 *
 * Runs every minute. Both sweeps are driven by the partial index on
 * (status, ends_at), so the cost stays flat as the archive grows rather than
 * scaling with every match ever created.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. Scheduled matches whose start time has passed.
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

  // 2. Live matches past their end time.
  const expired = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(eq(matches.status, "live"), isNotNull(matches.endsAt), lte(matches.endsAt, now)),
    );

  const settled: string[] = [];
  for (const match of expired) {
    await settleMatch(match.id, "time", now);
    settled.push(match.id);
  }

  return NextResponse.json({
    ok: true,
    started: started.length,
    settled: settled.length,
    at: now.toISOString(),
  });
}

/**
 * Closes a match and writes the result into both contenders' lifetime records.
 * Exported so the creator's "end early" action settles through exactly the
 * same path — two implementations of "who won" would eventually disagree.
 */
export async function settleMatch(
  matchId: string,
  decidedBy: "time" | "creator",
  now = new Date(),
) {
  const sides = await db
    .select({
      id: matchContenders.id,
      contenderId: matchContenders.contenderId,
      voteCount: matchContenders.voteCount,
    })
    .from(matchContenders)
    .where(eq(matchContenders.matchId, matchId));

  const [a, b] = sides;
  if (!a || !b) return;

  const draw = a.voteCount === b.voteCount;
  const winner = draw ? null : a.voteCount > b.voteCount ? a : b;
  const loser = draw ? null : winner === a ? b : a;

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

  if (draw) {
    for (const side of [a, b]) {
      await db
        .update(contenders)
        .set({ draws: sql`${contenders.draws} + 1` })
        .where(eq(contenders.id, side.contenderId));
    }
    return;
  }

  await db
    .update(contenders)
    .set({ wins: sql`${contenders.wins} + 1` })
    .where(eq(contenders.id, winner!.contenderId));
  await db
    .update(contenders)
    .set({ losses: sql`${contenders.losses} + 1` })
    .where(eq(contenders.id, loser!.contenderId));
}
