import Link from "next/link";

import { ContenderCard } from "@/components/match/contender-card";
import { Countdown } from "@/components/match/countdown";
import { LiveBadge } from "@/components/match/live-badge";
import { TugBar } from "@/components/match/seam";
import { VoteCountPill } from "@/components/match/vote-count-pill";
import { VersusMark } from "@/components/match/versus-mark";
import { Icon } from "@/components/ui/icon";
import type { MatchSummary } from "@/db/queries/matches";
import { splitPercentages } from "@/lib/utils";

/**
 * The headline fixture. Sits directly on the page — wrapping it in a panel
 * only drew a box around content that is already the largest thing on screen,
 * and cost vertical space the fold could not spare.
 *
 * The pair is width-capped rather than filling the container: two full-width
 * 1:1 portraits pushed the call to action onto a second screen.
 */
export function MainEvent({ match }: { match: MatchSummary }) {
  const [pa, pb] = splitPercentages(match.a.voteCount, match.b.voteCount);

  return (
    <section
      className="relative"
      style={{ ["--c-a" as string]: match.a.color, ["--c-b" as string]: match.b.color }}
    >
      {/* Absolute so the centred badge row below stays optically centred on the
          section rather than on the space left over beside the clock. */}
      {match.status === "live" && match.endsAt && (
        <div className="absolute right-0 top-0 hidden sm:block">
          <Countdown target={match.endsAt.toISOString()} prefix="Closes in" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-marigold-400 px-2.5 py-1">
          <Icon name="flame" size={13} className="text-ink" strong />
          <span className="label !text-ink">Main event</span>
        </span>
        {match.status === "live" && <LiveBadge />}
        <VoteCountPill total={match.totalVotes} />
        {match.status === "live" && match.endsAt && (
          <span className="sm:hidden">
            <Countdown target={match.endsAt.toISOString()} prefix="Closes in" />
          </span>
        )}
      </div>

      <div className="mt-3 text-center">
        <h1 className="text-balance font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.02] text-ink">
          {match.title}
        </h1>
        <p className="mx-auto mt-1.5 max-w-lg text-pretty text-sm text-ink-soft sm:text-base">
          {match.question}
        </p>
      </div>

      <div className="relative mx-auto mt-5 grid max-w-lg grid-cols-2 items-start gap-3 sm:gap-6">
        <ContenderCard contender={match.a} percentage={pa} revealed tilt="l" />
        <ContenderCard contender={match.b} percentage={pb} revealed tilt="r" />

        <div className="pointer-events-none absolute left-1/2 top-[30%] z-10 -translate-x-1/2 -translate-y-1/2">
          <VersusMark size={48} />
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-lg">
        <TugBar percentA={pa} revealed colorA={match.a.color} colorB={match.b.color} />
      </div>

      <div className="mt-5 flex justify-center">
        <Link
          href={`/m/${match.slug}`}
          className="press inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 font-bold text-paper hover:bg-ink-soft"
        >
          Cast your vote
          <Icon name="arrow-right" size={17} strong />
        </Link>
      </div>
    </section>
  );
}
