import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { txDb } from "@/db/tx";
import { matchContenders, matches, votes } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { voteSchema } from "@/lib/validation/match";
import {
  VOTER_COOKIE,
  getVoterIdentity,
  requestFingerprint,
} from "@/lib/voter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const { key: voterKey, freshToken } = await getVoterIdentity();
  const { ipHash, uaHash } = await requestFingerprint();

  const limit = rateLimit(`vote:${ipHash ?? voterKey}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Slow down a moment." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  // The target has to belong to this match, or a crafted request could add
  // votes to a contender in a completely different one.
  const [target] = await db
    .select({
      id: matchContenders.id,
      matchId: matchContenders.matchId,
      status: matches.status,
    })
    .from(matchContenders)
    .innerJoin(matches, eq(matches.id, matchContenders.matchId))
    .where(
      and(
        eq(matchContenders.id, parsed.data.matchContenderId),
        eq(matches.slug, slug),
      ),
    )
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (target.status !== "live") {
    return NextResponse.json(
      { error: target.status === "ended" ? "This match is over." : "This match hasn't started." },
      { status: 409 },
    );
  }

  const outcome = await txDb().transaction(async (tx) => {
    // Insert-or-nothing. The two unique indexes on `votes` are what actually
    // enforce one vote per person — checking first and inserting after would
    // let two concurrent requests from the same voter both pass the check.
    //
    // A conflict on EITHER index (same cookie, or same IP) means this person
    // has already voted on this match. Votes are final: there is no switching
    // path, so a second attempt changes nothing.
    const inserted = await tx
      .insert(votes)
      .values({
        matchId: target.matchId,
        matchContenderId: target.id,
        voterKey,
        ipHash,
        uaHash,
      })
      .onConflictDoNothing()
      .returning({ id: votes.id });

    if (inserted.length === 0) return "already-voted" as const;

    await tx
      .update(matchContenders)
      .set({ voteCount: sql`${matchContenders.voteCount} + 1` })
      .where(eq(matchContenders.id, target.id));
    await tx
      .update(matches)
      .set({ totalVotes: sql`${matches.totalVotes} + 1` })
      .where(eq(matches.id, target.matchId));
    return "counted" as const;
  });

  // Tell the client which side they are actually locked to, which may not be
  // the one they just clicked if they had already voted from another browser
  // on this network.
  const [own] = await db
    .select({ matchContenderId: votes.matchContenderId })
    .from(votes)
    .where(
      and(
        eq(votes.matchId, target.matchId),
        ipHash ? eq(votes.ipHash, ipHash) : eq(votes.voterKey, voterKey),
      ),
    )
    .limit(1);

  const tallies = await db
    .select({
      id: matchContenders.id,
      side: matchContenders.side,
      voteCount: matchContenders.voteCount,
    })
    .from(matchContenders)
    .where(eq(matchContenders.matchId, target.matchId));

  const a = tallies.find((t) => t.side === "a");
  const b = tallies.find((t) => t.side === "b");

  const response = NextResponse.json({
    outcome,
    votedFor: own?.matchContenderId ?? target.id,
    a: a?.voteCount ?? 0,
    b: b?.voteCount ?? 0,
    total: (a?.voteCount ?? 0) + (b?.voteCount ?? 0),
  });

  if (freshToken) {
    response.cookies.set(VOTER_COOKIE.name, freshToken, VOTER_COOKIE.options);
  }
  return response;
}
