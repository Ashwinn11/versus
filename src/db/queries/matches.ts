import "server-only";

import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { db } from "@/db";
import {
  categories,
  matchCategories,
  matchContenders,
  matchTags,
  matches,
  tags,
} from "@/db/schema";
import { toContender, type ResolvedContender } from "@/lib/contenders";

export type MatchStatus = "draft" | "scheduled" | "live" | "ended";

export type MatchSummary = {
  id: string;
  slug: string;
  title: string;
  question: string;
  status: MatchStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  totalVotes: number;
  isMainEvent: boolean;
  winnerMatchContenderId: string | null;
  category: { slug: string; name: string; accentColor: string } | null;
  a: ResolvedContender;
  b: ResolvedContender;
};

/** Opaque keyset cursor. Encodes the exact row we stopped at. */
export function encodeCursor(startsAt: Date | null, id: string): string {
  return Buffer.from(`${startsAt ? startsAt.toISOString() : ""}|${id}`).toString(
    "base64url",
  );
}

function decodeCursor(cursor: string): { startsAt: Date | null; id: string } | null {
  try {
    const [ts, id] = Buffer.from(cursor, "base64url").toString().split("|");
    if (!id) return null;
    return { startsAt: ts ? new Date(ts) : null, id };
  } catch {
    return null;
  }
}

/**
 * Every feed in the app — homepage, category, tag, Hall of Fame — is this one
 * query with different filters, so pagination is written and tuned once.
 *
 * Ordering is keyset, not OFFSET: offset pagination re-scans everything it
 * skips (so page 50 costs 50x page 1) and silently duplicates rows when a new
 * match lands mid-scroll.
 */
export async function listMatches(opts: {
  status?: MatchStatus | MatchStatus[];
  categorySlug?: string;
  tagSlug?: string;
  limit?: number;
  cursor?: string;
  excludeIds?: string[];
  createdBy?: string;
} = {}) {
  const limit = Math.min(opts.limit ?? 12, 48);
  const where = [];

  if (opts.status) {
    where.push(
      Array.isArray(opts.status)
        ? inArray(matches.status, opts.status)
        : eq(matches.status, opts.status),
    );
  }
  if (opts.createdBy) {
    where.push(eq(matches.createdBy, opts.createdBy));
  }
  if (opts.excludeIds?.length) {
    where.push(sql`${matches.id} not in ${opts.excludeIds}`);
  }
  if (opts.categorySlug) {
    where.push(
      sql`exists (
        select 1 from ${matchCategories}
        join ${categories} on ${categories.id} = ${matchCategories.categoryId}
        where ${matchCategories.matchId} = ${matches.id}
          and ${categories.slug} = ${opts.categorySlug})`,
    );
  }
  if (opts.tagSlug) {
    where.push(
      sql`exists (
        select 1 from ${matchTags}
        join ${tags} on ${tags.id} = ${matchTags.tagId}
        where ${matchTags.matchId} = ${matches.id}
          and ${tags.slug} = ${opts.tagSlug})`,
    );
  }

  const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
  if (cursor) {
    // Strict "after this exact row" — the id tiebreak is what stops rows with
    // identical timestamps from being skipped or repeated across pages.
    where.push(
      cursor.startsAt
        ? or(
            lt(matches.startsAt, cursor.startsAt),
            and(eq(matches.startsAt, cursor.startsAt), lt(matches.id, cursor.id)),
          )
        : lt(matches.id, cursor.id),
    );
  }

  // One round trip, not two. The keyset page is a subquery joined straight to
  // its contenders, so a feed costs a single query to Neon instead of
  // "fetch ids, wait, fetch rows" — which at ~250ms of latency each was the
  // dominant cost of every page.
  const page = db
    .select({ id: matches.id, startsAt: matches.startsAt })
    .from(matches)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(matches.startsAt), desc(matches.id))
    .limit(limit + 1)
    .as("page");

  const rows = await db
    .select({
      id: matches.id,
      slug: matches.slug,
      title: matches.title,
      question: matches.question,
      status: matches.status,
      startsAt: matches.startsAt,
      endsAt: matches.endsAt,
      totalVotes: matches.totalVotes,
      isMainEvent: matches.isMainEvent,
      winnerMatchContenderId: matches.winnerMatchContenderId,
      catSlug: categories.slug,
      catName: categories.name,
      catAccent: categories.accentColor,
      mc: matchContenders,
    })
    .from(page)
    .innerJoin(matches, eq(matches.id, page.id))
    .leftJoin(categories, eq(categories.id, matches.primaryCategoryId))
    .innerJoin(matchContenders, eq(matchContenders.matchId, matches.id))
    .orderBy(desc(matches.startsAt), desc(matches.id));

  const built = assembleMatches(rows);
  const hasMore = built.length > limit;
  const items = built.slice(0, limit);
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.startsAt, last.id) : null,
  };
}

/** Folds the joined rows (two per match) into one object per match. */
type JoinedRow = {
  id: string;
  slug: string;
  title: string;
  question: string;
  status: MatchStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  totalVotes: number;
  isMainEvent: boolean;
  winnerMatchContenderId: string | null;
  catSlug: string | null;
  catName: string | null;
  catAccent: string | null;
  mc: typeof matchContenders.$inferSelect;
};

function assembleMatches(rows: JoinedRow[]): MatchSummary[] {
  const order: string[] = [];
  const grouped = new Map<string, JoinedRow[]>();

  for (const row of rows) {
    const list = grouped.get(row.id);
    if (list) list.push(row);
    else {
      grouped.set(row.id, [row]);
      order.push(row.id);
    }
  }

  return order.flatMap((id) => {
    const group = grouped.get(id)!;
    const a = group.find((r) => r.mc.side === "a");
    const b = group.find((r) => r.mc.side === "b");
    // A match missing a side is unrenderable; skip it rather than crash the
    // whole feed on one bad row.
    if (!a || !b) return [];
    const m = group[0];
    return [
      {
        id: m.id,
        slug: m.slug,
        title: m.title,
        question: m.question,
        status: m.status,
        startsAt: m.startsAt,
        endsAt: m.endsAt,
        totalVotes: m.totalVotes,
        isMainEvent: m.isMainEvent,
        winnerMatchContenderId: m.winnerMatchContenderId,
        category: m.catSlug
          ? { slug: m.catSlug, name: m.catName!, accentColor: m.catAccent! }
          : null,
        a: toContender(a.mc),
        b: toContender(b.mc),
      },
    ];
  });
}

/** Loads full match rows for a set of ids, preserving the caller's ordering. */
export async function hydrateMatches(ids: string[]): Promise<MatchSummary[]> {
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: matches.id,
      slug: matches.slug,
      title: matches.title,
      question: matches.question,
      status: matches.status,
      startsAt: matches.startsAt,
      endsAt: matches.endsAt,
      totalVotes: matches.totalVotes,
      isMainEvent: matches.isMainEvent,
      winnerMatchContenderId: matches.winnerMatchContenderId,
      catSlug: categories.slug,
      catName: categories.name,
      catAccent: categories.accentColor,
      mc: matchContenders,
    })
    .from(matches)
    .leftJoin(categories, eq(categories.id, matches.primaryCategoryId))
    .innerJoin(matchContenders, eq(matchContenders.matchId, matches.id))
    .where(inArray(matches.id, ids));

  const built = assembleMatches(rows);
  const order = new Map(ids.map((id, i) => [id, i]));
  return built.sort((x, y) => order.get(x.id)! - order.get(y.id)!);
}

export const getMatchBySlug = cache(async function getMatchBySlug(
  slug: string,
): Promise<MatchSummary | null> {
  const [row] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.slug, slug))
    .limit(1);
  if (!row) return null;
  const [match] = await hydrateMatches([row.id]);
  return match ?? null;
});

/** The single headline fixture. Falls back to the liveliest match. */
export async function getMainEvent(): Promise<MatchSummary | null> {
  const [featured] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.isMainEvent, true), eq(matches.status, "live")))
    .orderBy(matches.featuredRank)
    .limit(1);

  if (featured) return (await hydrateMatches([featured.id]))[0] ?? null;

  const [busiest] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.status, "live"))
    .orderBy(desc(matches.totalVotes))
    .limit(1);
  return busiest ? ((await hydrateMatches([busiest.id]))[0] ?? null) : null;
}

/**
 * Categories are seeded and effectively static, but the header renders them on
 * every page — so uncached this was one query per request, forever, for rows
 * that change roughly never.
 *
 * Two layers: `unstable_cache` keeps them out of the database across requests,
 * and `cache` dedupes within a single render (the header and a feed page's
 * rail both ask for them).
 */
export const listCategories = cache(
  unstable_cache(
    async () => db.select().from(categories).orderBy(categories.sortOrder),
    ["categories"],
    { revalidate: 3600, tags: ["categories"] },
  ),
);

/** Live tallies only — what the SSE stream and the vote response return. */
export async function getTallies(matchId: string) {
  const rows = await db
    .select({
      id: matchContenders.id,
      side: matchContenders.side,
      voteCount: matchContenders.voteCount,
    })
    .from(matchContenders)
    .where(eq(matchContenders.matchId, matchId));

  const a = rows.find((r) => r.side === "a");
  const b = rows.find((r) => r.side === "b");
  return {
    a: a?.voteCount ?? 0,
    b: b?.voteCount ?? 0,
    total: (a?.voteCount ?? 0) + (b?.voteCount ?? 0),
  };
}
