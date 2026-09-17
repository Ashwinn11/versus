import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { matches } from "@/db/schema";
import { getTallies } from "@/db/queries/matches";

/** Polling fallback for clients where SSE never connects. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [match] = await db
    .select({ id: matches.id, status: matches.status })
    .from(matches)
    .where(eq(matches.slug, slug))
    .limit(1);

  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tallies = await getTallies(match.id);
  return NextResponse.json(
    { ...tallies, status: match.status },
    { headers: { "cache-control": "no-store" } },
  );
}
