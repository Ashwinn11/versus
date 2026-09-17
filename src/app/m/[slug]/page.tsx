import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Countdown } from "@/components/match/countdown";
import { LiveBadge } from "@/components/match/live-badge";
import { ShareRow } from "@/components/match/share-row";
import { TaleOfTheTape } from "@/components/match/tale-of-the-tape";
import { VoteArena } from "@/components/match/vote-arena";
import { MatchStructuredData } from "@/components/structured-data";
import { Icon, categoryIcon } from "@/components/ui/icon";
import { db } from "@/db";
import { getMatchBySlug } from "@/db/queries/matches";
import { votes } from "@/db/schema";
import { getVoterIdentity } from "@/lib/voter";

/** Tallies are inlined in the HTML, so this renders per request. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) return { title: "Match not found" };

  const title = `${match.a.name} vs. ${match.b.name}`;
  return {
    title,
    description: match.question,
    // Self-referencing canonical: a match is reachable from several feeds, and
    // without this those become competing duplicates of the same page.
    alternates: { canonical: `/m/${slug}` },
    openGraph: {
      title,
      description: match.question,
      type: "article",
      url: `/m/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description: match.question },
  };
}

export default async function MatchPage({ params }: PageProps<"/m/[slug]">) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) notFound();

  // Look up this viewer's existing vote so a revisit shows their pick and the
  // standings instead of asking them to choose again.
  const { key: voterKey } = await getVoterIdentity();
  const [existing] = await db
    .select({ matchContenderId: votes.matchContenderId })
    .from(votes)
    .where(and(eq(votes.matchId, match.id), eq(votes.voterKey, voterKey)))
    .limit(1);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6 sm:pt-6">
      <MatchStructuredData match={match} />
      {/* The clock is the one piece of state that keeps changing while you
          read, so it sits out of the centred column entirely — top right,
          where a scoreboard clock belongs, instead of pushing the question
          and the cards further down the page. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="press inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <Icon name="chevron-right" size={15} className="rotate-180" />
          All matches
        </Link>

        {match.status === "live" && match.endsAt && (
          <Countdown target={match.endsAt.toISOString()} prefix="Closes in" />
        )}
        {match.status === "scheduled" && match.startsAt && (
          <Countdown target={match.startsAt.toISOString()} prefix="Starts in" />
        )}
      </div>

      <div className="text-center">
        <VoteArena
          slug={match.slug}
          a={match.a}
          b={match.b}
          status={match.status}
          winnerId={match.winnerMatchContenderId}
          initialVotedFor={existing?.matchContenderId ?? null}
          badges={
            <>
              {match.status === "live" && <LiveBadge />}
              {match.status === "ended" && (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-marigold-400 px-2.5 py-1">
                  <Icon name="trophy" size={13} className="text-ink" strong />
                  <span className="label !text-ink">Final</span>
                </span>
              )}
              {match.category && (
                <Link
                  href={`/c/${match.category.slug}`}
                  className="press inline-flex items-center gap-1.5 rounded-pill bg-card px-2.5 py-1 ring-1 ring-rule hover:ring-rule-strong"
                >
                  <Icon
                    name={categoryIcon(match.category.slug)}
                    size={13}
                    style={{ color: match.category.accentColor }}
                  />
                  <span className="label">{match.category.name}</span>
                </Link>
              )}
            </>
          }
        >
          <h1 className="mt-3 text-balance font-display text-[clamp(1.75rem,4.2vw,2.75rem)] leading-[1.02] text-ink">
            {match.title}
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-ink-soft sm:text-base">
            {match.question}
          </p>

        </VoteArena>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <TaleOfTheTape a={match.a} b={match.b} />
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <ShareRow slug={match.slug} />
      </div>

    </div>
  );
}
