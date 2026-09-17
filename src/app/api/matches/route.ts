import { NextResponse, type NextRequest } from "next/server";

import { createMatch } from "@/db/queries/create-match";
import { listMatches, type MatchStatus } from "@/db/queries/matches";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { createMatchSchema } from "@/lib/validation/match";
import { z } from "zod";

const STATUSES = new Set(["draft", "scheduled", "live", "ended"]);

/** Backs the "Load more" control on every feed. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const status = p.get("status");

  // `mine=1` scopes to the signed-in user. Deliberately not a user id in the
  // query string — that would let anyone page through another person's feed.
  let createdBy: string | undefined;
  if (p.get("mine") === "1") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ items: [], nextCursor: null });
    }
    createdBy = session.user.id;
  }

  const { items, nextCursor } = await listMatches({
    createdBy,
    status: status && STATUSES.has(status) ? (status as MatchStatus) : undefined,
    categorySlug: p.get("category") ?? undefined,
    tagSlug: p.get("tag") ?? undefined,
    cursor: p.get("cursor") ?? undefined,
    limit: Number(p.get("limit")) || 12,
  });

  return NextResponse.json(
    { items, nextCursor },
    {
      headers: {
        // A personal feed must never be shared by a cache. Public feeds can be
        // held briefly at the edge and served stale while revalidating, which
        // absorbs the bursts that follow a match being shared.
        "cache-control": createdBy
          ? "private, no-store"
          : "public, s-maxage=15, stale-while-revalidate=60",
      },
    },
  );
}

/** Creating is the one action that requires an account. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to create a match" }, { status: 401 });
  }

  const limit = rateLimit(`create:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "You've created a lot of matches. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = createMatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const match = await createMatch(parsed.data, session.user.id);
    return NextResponse.json({ slug: match.slug }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create the match";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
